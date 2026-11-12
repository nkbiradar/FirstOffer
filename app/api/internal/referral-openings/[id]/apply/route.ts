import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasInternalAccess } from "@/lib/data/subscriptions";
import { checkRateLimit } from "@/lib/rate-limit";
import { notifyAdmins } from "@/lib/email/admin-notify";
import { REFERRAL_EXTRA_FIELDS, cleanUrl, getReferralOpening } from "@/lib/data/referral-openings";

type RouteContext = { params: Promise<{ id: string }> };

// An Internal HR member applies for a referral at one company listed in
// /internal-openings → "Referral openings" (components/ReferralOpeningApply.tsx).
// Like the general referral sign-up, the resume is emailed to the admin as an
// attachment and never stored; the contact details and links are saved on
// referral_opening_applications so the admin page can list applicants.

const MAX_BYTES = 4 * 1024 * 1024; // Vercel caps request bodies at ~4.5 MB

function detectType(bytes: Uint8Array): "pdf" | "docx" | "doc" | null {
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return "pdf";
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) return "docx";
  if (bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0) return "doc";
  return null;
}

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(request: NextRequest, context: RouteContext) {
  const user = await getUser();
  if (!user) return bad("Please sign in first.", 401);
  if (!(await hasInternalAccess(user.id))) return bad("Referrals are part of the Internal HR plan.", 403);

  const { id } = await context.params;
  const opening = await getReferralOpening(id);
  if (!opening || !opening.is_active) return bad("This referral opening is closed.", 404);

  const { allowed } = await checkRateLimit(`referral-apply:${user.id}`, { windowSeconds: 3600, maxHits: 15 });
  if (!allowed) return bad("Too many attempts. Please try again in an hour.", 429);

  let fd: FormData;
  try {
    fd = await request.formData();
  } catch {
    return bad("Upload failed — please try again.");
  }

  const email = String(fd.get("email") ?? "").trim().slice(0, 160);
  const mobile = String(fd.get("mobile") ?? "")
    .replace(/[\s-]/g, "")
    .replace(/^(\+91|91|0)(?=\d{10}$)/, "");
  const file = fd.get("resume");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad("Please enter a valid email address.");
  if (!/^[6-9]\d{9}$/.test(mobile)) return bad("Please enter a valid 10-digit mobile number.");
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_BYTES) {
    return bad("Please attach your resume (PDF or Word, under 4 MB).");
  }

  // Only the fields the admin turned on for this company are read.
  const extras: Record<string, string> = {};
  for (const f of REFERRAL_EXTRA_FIELDS) {
    const mode = opening.fields[f.key];
    if (!mode) continue;
    let value: string | null;
    if (f.type === "url") {
      value = cleanUrl(fd.get(f.key), "hosts" in f ? f.hosts : undefined);
      if (value === null) return bad(`Please enter a valid link for "${f.label}".`);
    } else {
      value = String(fd.get(f.key) ?? "").trim().slice(0, f.type === "textarea" ? 1500 : 200);
    }
    if (mode === "required" && !value) return bad(`"${f.label}" is required for this company.`);
    if (value) extras[f.key] = value;
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const kind = detectType(buffer);
  if (!kind) return bad("Resume must be a PDF or Word (.doc / .docx) file.");

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const name = String(meta.full_name ?? meta.name ?? "").trim() || email.split("@")[0];
  const safeName = name.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "resume";
  const safeCompany = opening.company.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "company";
  const roleLine = [opening.role, opening.location].filter(Boolean).join(" · ");

  const sent = await notifyAdmins(
    `🤝 Referral request — ${opening.company}${opening.role ? ` (${opening.role})` : ""}: ${name}`,
    [
      ["Company", opening.company],
      ["Role", roleLine],
      ["Name", name],
      ["Email", email],
      ["Mobile", `+91 ${mobile}`],
      ...REFERRAL_EXTRA_FIELDS.filter((f) => extras[f.key]).map((f) => [f.label, extras[f.key]] as [string, string]),
      ["Account email", user.email ?? ""],
    ],
    "/admin/referral-openings",
    "Open referral openings",
    [{ filename: `${safeName}_${safeCompany}_resume.${kind}`, content: buffer }],
    email,
  );
  if (!sent) return bad("That didn't go through. Please try again in a minute.", 502);

  const now = new Date().toISOString();
  const admin = createAdminClient();
  const { error } = await admin.from("referral_opening_applications").upsert(
    { opening_id: opening.id, user_id: user.id, details: { name, email, mobile, ...extras }, updated_at: now },
    { onConflict: "opening_id,user_id" },
  );
  if (error) console.error("referral apply: save failed:", error.message);

  // Remember the details so the next form is pre-filled.
  const remembered: Record<string, string> = { referral_email: email, referral_mobile: mobile };
  for (const k of ["linkedin", "github", "coding", "portfolio", "college", "experience", "notice"]) {
    if (extras[k]) remembered[`referral_${k}`] = extras[k];
  }
  const { error: metaError } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...meta, ...remembered },
  });
  if (metaError) console.error("referral apply: metadata update failed:", metaError.message);

  return NextResponse.json({ ok: true, appliedAt: now });
}
