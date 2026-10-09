import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/supabase/auth";
import { syncReferralRewards } from "@/lib/data/referrals";
import { CLAIM_REQUIREMENTS, displayName, type ClaimKind } from "@/lib/data/referral-rewards";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAdmins } from "@/lib/email/admin-notify";

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
const PHONE = /^[+\d][\d\s-]{7,18}$/;
const URL_RE = /^https?:\/\/\S+$/i;

// Claim a Refer & Earn reward: "profile_push" (15 sign-ups — profile shared
// with 5 hiring companies) or "goodies" (25 sign-ups — FirstOffer goodies).
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const kind = body.kind as ClaimKind;
  if (!(kind in CLAIM_REQUIREMENTS)) return NextResponse.json({ error: "Unknown reward." }, { status: 400 });

  const stats = await syncReferralRewards(user.id, displayName(user));
  const needed = CLAIM_REQUIREMENTS[kind];
  if (stats.signups < needed) {
    return NextResponse.json(
      { error: `You need ${needed} friends to sign up with your link (you have ${stats.signups}).` },
      { status: 403 },
    );
  }

  let details: Record<string, string>;
  let subject: string;
  if (kind === "profile_push") {
    details = {
      fullName: clean(body.fullName, 120),
      phone: clean(body.phone, 20),
      targetRole: clean(body.targetRole, 120),
      resumeUrl: clean(body.resumeUrl, 400),
      linkedin: clean(body.linkedin, 300),
    };
    if (!details.fullName || !PHONE.test(details.phone) || !details.targetRole || !URL_RE.test(details.resumeUrl)) {
      return NextResponse.json(
        { error: "Please add your name, a valid phone number, target role and a resume link (Google Drive etc.)." },
        { status: 400 },
      );
    }
    subject = `📨 Profile push request: ${details.fullName} — ${details.targetRole}`;
  } else {
    details = {
      fullName: clean(body.fullName, 120),
      phone: clean(body.phone, 20),
      address: clean(body.address, 500),
      pincode: clean(body.pincode, 6),
      tshirtSize: clean(body.tshirtSize, 4),
    };
    if (!details.fullName || !PHONE.test(details.phone) || !details.address || !/^\d{6}$/.test(details.pincode)) {
      return NextResponse.json({ error: "Please add your name, phone, full address and a 6-digit pincode." }, { status: 400 });
    }
    subject = `🎁 Goodies claim: ${details.fullName} (${details.pincode})`;
  }

  const { error } = await createAdminClient()
    .from("referral_claims")
    .insert({ user_id: user.id, kind, details, signups_at_claim: stats.signups });
  if (error) {
    if (/duplicate|unique/i.test(error.message)) {
      return NextResponse.json({ error: "You've already claimed this reward." }, { status: 409 });
    }
    console.error("referral claim insert failed:", error.message);
    return NextResponse.json({ error: "Could not submit — please try again." }, { status: 500 });
  }

  void notifyAdmins(
    subject,
    [
      ...Object.entries(details).map(([k, v]) => [k, v] as [string, string]),
      ["Account email", user.email ?? ""],
      ["Friends signed up", String(stats.signups)],
    ],
    "/admin/referrals",
    "Open referral rewards",
    [],
    user.email ?? undefined,
  );

  revalidatePath("/dashboard");
  return NextResponse.json({ ok: true });
}
