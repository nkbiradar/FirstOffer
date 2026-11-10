import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasInternalAccess } from "@/lib/data/subscriptions";
import { checkRateLimit } from "@/lib/rate-limit";
import { notifyAdmins } from "@/lib/email/admin-notify";

// Internal HR members' "Referrals" sign-up (app/internal-openings,
// components/ReferralProfileForm.tsx). The member shares their resume,
// email and mobile number; whenever a company hires through referrals, our
// employees refer them. Same delivery as the Resume Makeover upload: the
// resume is emailed to the admin mailbox as an attachment and never stored
// by the site. The only thing saved is `referral_profile_at` on the user's
// metadata, so the page can show "You're on the referral list".

const MAX_BYTES = 4 * 1024 * 1024; // Vercel caps request bodies at ~4.5 MB

function detectType(bytes: Uint8Array): "pdf" | "docx" | "doc" | null {
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return "pdf"; // %PDF
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) return "docx"; // ZIP container
  if (bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0) return "doc"; // OLE2
  return null;
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }
  if (!(await hasInternalAccess(user.id))) {
    return NextResponse.json({ error: "Referrals are part of the Internal HR plan." }, { status: 403 });
  }

  const { allowed } = await checkRateLimit(`referral-profile:${user.id}`, { windowSeconds: 3600, maxHits: 5 });
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Please try again in an hour." }, { status: 429 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Upload failed — please try again." }, { status: 400 });
  }

  const email = String(formData.get("email") ?? "").trim().slice(0, 160);
  const mobileRaw = String(formData.get("mobile") ?? "").replace(/[\s-]/g, "");
  const mobile = mobileRaw.replace(/^(\+91|91|0)(?=\d{10}$)/, "");
  const file = formData.get("resume");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (!/^[6-9]\d{9}$/.test(mobile)) {
    return NextResponse.json({ error: "Please enter a valid 10-digit mobile number." }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Please attach your resume (PDF or Word, under 4 MB)." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const kind = detectType(buffer);
  if (!kind) {
    return NextResponse.json({ error: "Resume must be a PDF or Word (.doc / .docx) file." }, { status: 400 });
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const name = String(meta.full_name ?? meta.name ?? "").trim() || email.split("@")[0];
  const safeName = name.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "resume";
  const isUpdate = Boolean(meta.referral_profile_at);

  const sent = await notifyAdmins(
    `🤝 ${isUpdate ? "Updated" : "New"} referral profile: ${name}`,
    [
      ["Name", name],
      ["Email", email],
      ["Mobile", `+91 ${mobile}`],
      ["Account email", user.email ?? ""],
      ["Plan", "Internal HR (active)"],
    ],
    "/admin",
    "Open admin",
    [{ filename: `${safeName}_resume.${kind}`, content: buffer }],
    email,
  );

  if (!sent) {
    return NextResponse.json({ error: "That didn't go through. Please try again in a minute." }, { status: 502 });
  }

  const submittedAt = new Date().toISOString();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...meta, referral_profile_at: submittedAt, referral_mobile: mobile, referral_email: email },
  });
  if (error) console.error("referral-profile: metadata update failed:", error.message);

  return NextResponse.json({ ok: true, submittedAt });
}
