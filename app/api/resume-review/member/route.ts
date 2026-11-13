import { randomUUID } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasFullAccess } from "@/lib/data/opportunity-unlocks";
import { checkRateLimit } from "@/lib/rate-limit";
import { notifyAdmins } from "@/lib/email/admin-notify";
import { FULL_ACCESS_PERIOD_MS } from "@/lib/payments/razorpay";

// Resume Makeover for Full Access members (included in the ₹149 plan since
// 13 Nov 2026 — the separate ₹199 purchase is gone). One request carries the
// details + resume; the resume is emailed to the admin and never stored.
// The order is recorded in resume_orders with amount 0 and a "member_…"
// order id so the 1-makeover-per-3-month-plan limit can be enforced.

const MAX_BYTES = 4 * 1024 * 1024; // Vercel caps request bodies at ~4.5 MB

function detectType(bytes: Uint8Array): "pdf" | "docx" | "doc" | null {
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return "pdf";
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) return "docx";
  if (bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0) return "doc";
  return null;
}

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });
const clip = (v: FormDataEntryValue | null, max: number) => String(v ?? "").trim().slice(0, max);

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return bad("Please sign in first.", 401);
  if (!(await hasFullAccess(user.id))) return bad("Resume Makeover is included with Full Access.", 403);

  const { allowed } = await checkRateLimit(`resume-review-member:${user.id}`, { windowSeconds: 600, maxHits: 6 });
  if (!allowed) return bad("Too many attempts. Please wait a few minutes.", 429);

  const admin = createAdminClient();
  const since = new Date(Date.now() - FULL_ACCESS_PERIOD_MS).toISOString();
  const { count } = await admin
    .from("resume_orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .like("razorpay_order_id", "member_%")
    .gte("created_at", since);
  if ((count ?? 0) >= 1) {
    return bad("You've already used your Resume Makeover for this plan. It's 1 makeover per 3-month plan.", 409);
  }

  let fd: FormData;
  try {
    fd = await request.formData();
  } catch {
    return bad("Upload failed — please try again.");
  }

  const fullName = clip(fd.get("fullName"), 80);
  const email = clip(fd.get("email"), 160).toLowerCase() || (user.email ?? "");
  const phone = clip(fd.get("phone"), 20);
  const targetRole = clip(fd.get("targetRole"), 100);
  const experienceLevel = clip(fd.get("experienceLevel"), 40);
  const notes = clip(fd.get("notes"), 600);
  const file = fd.get("resume");

  if (!fullName || !targetRole) return bad("Please fill in your name and the role you're targeting.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return bad("Please enter a valid email to receive your resume.");
  if (phone && !/^[+\d][\d\s-]{7,19}$/.test(phone)) return bad("Please enter a valid phone number (or leave it empty).");
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_BYTES) {
    return bad("Please attach your resume (PDF or Word, under 4 MB).");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const kind = detectType(buffer);
  if (!kind) return bad("Resume must be a PDF or Word (.doc / .docx) file.");

  const safeName = fullName.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "resume";
  const sent = await notifyAdmins(
    `📄 New Resume Makeover (Full Access): ${fullName} — ${targetRole}`,
    [
      ["Name", fullName],
      ["Send resume to", email],
      ["Account email", user.email ?? ""],
      ["Phone", phone],
      ["Target role", targetRole],
      ["Experience", experienceLevel],
      ["Notes", notes],
      ["Plan", "Full Access (included)"],
    ],
    "/admin",
    "Open admin",
    [{ filename: `${safeName}_resume.${kind}`, content: buffer }],
    email,
  );
  if (!sent) return bad("That didn't go through. Please try again in a minute.", 502);

  const now = new Date().toISOString();
  const { error } = await admin.from("resume_orders").insert({
    user_id: user.id,
    razorpay_order_id: `member_${randomUUID()}`,
    amount_paise: 0,
    status: "submitted",
    full_name: fullName,
    email,
    phone: phone || null,
    target_role: targetRole,
    experience_level: experienceLevel || null,
    notes: notes || null,
    resume_file_name: file.name.slice(0, 200),
    paid_at: now,
    submitted_at: now,
  });
  if (error) console.error("resume member: save failed:", error.message);

  return NextResponse.json({ ok: true });
}
