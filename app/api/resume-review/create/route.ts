import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRazorpayClient, RESUME_REVIEW_PRICE_PAISE } from "@/lib/payments/razorpay";
import { checkRateLimit } from "@/lib/rate-limit";

// Step 1 of the paid Resume Makeover (components/ResumeMakeoverCard.tsx):
// saves the student's details and opens a one-time Razorpay Order. The
// resume file is sent afterwards, to app/api/resume-review/upload, once the
// payment is verified — so an abandoned checkout never leaves a stray
// resume in the admin mailbox.

const MAX = { name: 80, phone: 20, role: 100, level: 40, notes: 600 };

function clip(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  const { allowed } = await checkRateLimit(`resume-review-create:${user.id}`, { windowSeconds: 60, maxHits: 6 });
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment and try again." }, { status: 429 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const fullName = clip(body.fullName, MAX.name);
  const phone = clip(body.phone, MAX.phone);
  const targetRole = clip(body.targetRole, MAX.role);
  const experienceLevel = clip(body.experienceLevel, MAX.level);
  const notes = clip(body.notes, MAX.notes);

  if (!fullName || !targetRole) {
    return NextResponse.json({ error: "Please fill in your name and the role you're targeting." }, { status: 400 });
  }
  if (phone && !/^[+\d][\d\s-]{7,19}$/.test(phone)) {
    return NextResponse.json({ error: "Please enter a valid phone number (or leave it empty)." }, { status: 400 });
  }

  let order;
  try {
    order = await getRazorpayClient().orders.create({
      amount: RESUME_REVIEW_PRICE_PAISE,
      currency: "INR",
      notes: { user_id: user.id, product: "resume_review" },
    });
  } catch (err) {
    console.error("Resume review: Razorpay order creation failed:", err);
    return NextResponse.json({ error: "Could not start payment. Try again." }, { status: 502 });
  }

  const { error } = await createAdminClient().from("resume_orders").insert({
    user_id: user.id,
    razorpay_order_id: order.id,
    amount_paise: RESUME_REVIEW_PRICE_PAISE,
    status: "created",
    full_name: fullName,
    email: (user.email ?? "").slice(0, 160),
    phone: phone || null,
    target_role: targetRole,
    experience_level: experienceLevel || null,
    notes: notes || null,
  });
  if (error) {
    console.error("Resume review: could not save order:", error.message);
    return NextResponse.json({ error: "Could not start payment. Try again." }, { status: 500 });
  }

  return NextResponse.json({
    orderId: order.id,
    amount: RESUME_REVIEW_PRICE_PAISE,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
}
