import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyRazorpaySignature } from "@/lib/payments/verify-signature";

// Step 2: called by the browser right after Razorpay Checkout succeeds.
// Marks the resume_orders row 'paid'. app/api/payments/webhook (product
// "resume_review") is the backstop if this call never happens.
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: { razorpay_order_id?: string; razorpay_payment_id?: string; razorpay_signature?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment details." }, { status: 400 });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json({ error: "Payment not configured." }, { status: 500 });
  }

  if (
    !verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      keySecret,
    })
  ) {
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  const { error } = await createAdminClient()
    .from("resume_orders")
    .update({ status: "paid", razorpay_payment_id, paid_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("razorpay_order_id", razorpay_order_id)
    .eq("status", "created");

  if (error) {
    console.error("Resume review: could not mark order paid:", error.message);
    return NextResponse.json({ error: "Could not confirm payment. Contact support." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
