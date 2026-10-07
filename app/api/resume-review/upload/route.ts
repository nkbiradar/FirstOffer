import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { notifyAdmins } from "@/lib/email/admin-notify";

// Step 3: receives the student's current resume for a PAID order and emails
// it (as an attachment) to the admin mailbox along with their details.
// The file is never stored by the site — the email is the delivery. If the
// email fails, the order stays 'paid' and the student can retry from /resume.

// Vercel caps request bodies at ~4.5 MB, so stay safely under that.
const MAX_BYTES = 4 * 1024 * 1024;

function detectType(bytes: Uint8Array): "pdf" | "docx" | "doc" | null {
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return "pdf"; // %PDF
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) return "docx"; // ZIP container
  if (bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0) return "doc"; // OLE2
  return null;
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { allowed } = await checkRateLimit(`resume-review-upload:${user.id}`, { windowSeconds: 600, maxHits: 8 });
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Please wait a few minutes." }, { status: 429 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Upload failed — please try again." }, { status: 400 });
  }

  const orderId = String(formData.get("orderId") ?? "").trim();
  const file = formData.get("resume");
  if (!orderId || !(file instanceof File)) {
    return NextResponse.json({ error: "Please attach your resume." }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Resume must be a PDF or Word file under 4 MB." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const kind = detectType(buffer);
  if (!kind) {
    return NextResponse.json({ error: "Resume must be a PDF or Word (.doc / .docx) file." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: order, error: readError } = await admin
    .from("resume_orders")
    .select("id, status, full_name, email, phone, target_role, experience_level, notes, razorpay_payment_id")
    .eq("user_id", user.id)
    .eq("razorpay_order_id", orderId)
    .maybeSingle();

  if (readError || !order) {
    return NextResponse.json({ error: "We couldn't find this order." }, { status: 404 });
  }
  if (order.status === "submitted" || order.status === "delivered") {
    return NextResponse.json({ ok: true, alreadySubmitted: true });
  }
  if (order.status !== "paid") {
    return NextResponse.json({ error: "Payment for this order isn't confirmed yet." }, { status: 409 });
  }

  const safeName = order.full_name.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "resume";
  const filename = `${safeName}_resume.${kind}`;

  const sent = await notifyAdmins(
    `📄 New Resume Makeover: ${order.full_name} — ${order.target_role}`,
    [
      ["Name", order.full_name],
      ["Send resume to", order.email],
      ["Account email", user.email ?? ""],
      ["Phone", order.phone ?? ""],
      ["Target role", order.target_role],
      ["Experience", order.experience_level ?? ""],
      ["Notes", order.notes ?? ""],
      ["Razorpay order", orderId],
      ["Razorpay payment", order.razorpay_payment_id ?? ""],
    ],
    "/admin",
    "Open admin",
    [{ filename, content: buffer }],
    order.email,
  );

  if (!sent) {
    return NextResponse.json(
      { error: "Your payment is safe, but the upload didn't go through. Please try again in a minute." },
      { status: 502 },
    );
  }

  await admin
    .from("resume_orders")
    .update({ status: "submitted", resume_file_name: file.name.slice(0, 200), submitted_at: new Date().toISOString() })
    .eq("id", order.id);

  return NextResponse.json({ ok: true });
}
