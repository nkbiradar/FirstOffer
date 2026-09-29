import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyRazorpaySignature } from "@/lib/payments/verify-signature";
import { MANUAL_ACCESS_PERIOD_MS } from "@/lib/payments/razorpay";
import { recordCouponRedemption } from "@/lib/payments/coupons";

// Fast path, called by the browser right after Razorpay Checkout's success
// handler fires for the one-time monthly payment (see
// components/UnlockContactCard.tsx). This used to verify a Subscription
// payment's signature ("payment_id|subscription_id"); now it's a plain
// Order payment, so it uses the same order-signature check
// (verifyRazorpaySignature, "order_id|payment_id") as the legacy one-time
// unlock in app/api/payments/verify/route.ts — same Razorpay mechanism,
// just a different table on success. app/api/payments/webhook/route.ts's
// payment.captured handling is the reliability backstop if this call never
// happens (tab closed right after paying).
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };
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

  const signatureValid = verifyRazorpaySignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
    keySecret,
  });

  if (!signatureValid) {
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  const admin = createAdminClient();
  // A verified payment buys exactly 30 days of access from right now — see
  // app/api/subscriptions/create/route.ts's comment for why this is a
  // plain one-time payment rather than a recurring Autopay mandate.
  const currentPeriodEnd = new Date(Date.now() + MANUAL_ACCESS_PERIOD_MS).toISOString();

  const { data: updatedRow, error } = await admin
    .from("subscriptions")
    .update({
      status: "active",
      razorpay_payment_id,
      current_period_end: currentPeriodEnd,
      cancelled_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("razorpay_subscription_id", razorpay_order_id)
    .select("coupon_id")
    .maybeSingle();

  if (error) {
    console.error("Could not mark subscription as active:", error.message);
    return NextResponse.json({ error: "Could not confirm payment. Contact support." }, { status: 500 });
  }

  // If this order used a partner coupon (e.g. ALGOCRUX), log the
  // redemption now that the payment is actually confirmed — this is what
  // lets a partner's redemption count double as attribution tracking (see
  // lib/payments/coupons.ts). Payment already succeeded by this point, so
  // a failure here is logged but never turned into an error response.
  if (updatedRow?.coupon_id) {
    await recordCouponRedemption(updatedRow.coupon_id, user.id, razorpay_order_id);
  }

  return NextResponse.json({ ok: true });
}
