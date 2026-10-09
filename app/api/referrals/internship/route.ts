import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/supabase/auth";
import { syncReferralRewards } from "@/lib/data/referrals";
import {
  INTERNSHIP_PAID_REQUIRED,
  INTERNSHIP_STIPEND_INR,
  displayName,
  getInternshipApplication,
} from "@/lib/data/referral-rewards";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAdmins } from "@/lib/email/admin-notify";

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

// Apply for the FirstOffer Growth Internship interview — only after 25
// friends who signed up through your link have bought Full Access.
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const stats = await syncReferralRewards(user.id, displayName(user));
  if (stats.paid < INTERNSHIP_PAID_REQUIRED) {
    return NextResponse.json(
      { error: `You need ${INTERNSHIP_PAID_REQUIRED} friends who bought Full Access to apply (you have ${stats.paid}).` },
      { status: 403 },
    );
  }
  if (await getInternshipApplication(user.id)) {
    return NextResponse.json({ error: "You've already applied — we'll be in touch." }, { status: 409 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const fullName = clean(body.fullName, 120);
  const phone = clean(body.phone, 20);
  const college = clean(body.college, 160);
  const linkedin = clean(body.linkedin, 300);
  const why = clean(body.why, 1500);
  if (!fullName || !/^[+\d][\d\s-]{7,18}$/.test(phone) || !college) {
    return NextResponse.json({ error: "Please fill in your name, a valid phone number and your college." }, { status: 400 });
  }
  if (linkedin && !/^https?:\/\/([a-z]+\.)?linkedin\.com\//i.test(linkedin)) {
    return NextResponse.json({ error: "Please enter a valid LinkedIn profile link." }, { status: 400 });
  }

  const { error } = await createAdminClient().from("internship_applications").insert({
    user_id: user.id,
    full_name: fullName,
    email: user.email ?? "",
    phone,
    college,
    linkedin_url: linkedin || null,
    why: why || null,
    paid_referrals: stats.paid,
  });
  if (error) {
    console.error("internship application insert failed:", error.message);
    return NextResponse.json({ error: "Could not submit — please try again." }, { status: 500 });
  }

  void notifyAdmins(
    `🎓 Growth Internship application: ${fullName} (${stats.paid} paying referrals)`,
    [
      ["Name", fullName],
      ["Email", user.email ?? ""],
      ["Phone", phone],
      ["College", college],
      ["LinkedIn", linkedin],
      ["Why", why],
      ["Paying referrals", String(stats.paid)],
      ["Stipend offered", `₹${INTERNSHIP_STIPEND_INR.toLocaleString("en-IN")}/month`],
    ],
    "/admin/referrals",
    "Review applications",
    [],
    user.email ?? undefined,
  );

  revalidatePath("/dashboard");
  return NextResponse.json({ ok: true });
}
