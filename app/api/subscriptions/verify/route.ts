import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyRazorpaySubscriptionSignature } from "@/lib/payments/verify-signature";

// Fast path, called by the browser right after Razorpay Checkout's success
// handler fires for a subscription (see components/UnlockContactCard.tsx).
// app/api/payments/webhook/route.ts's subscription.activated/charged
// handling is the reliability backstop if this call never happens.
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: {
    razorpay_subscription_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { razorpay_subscription_id, razorpay_payment_id, razorpay_signature } = body;
  if (!razorpay_subscription_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment details." }, { status: 400 });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json({ error: "Payment not configured." }, { status: 500 });
  }

  const signatureValid = verifyRazorpaySubscriptionSignature({
    subscriptionId: razorpay_subscription_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
    keySecret,
  });

  if (!signatureValid) {
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("subscriptions")
    .update({
      status: "active",
      razorpay_payment_id,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("razorpay_subscription_id", razorpay_subscription_id);

  if (error) {
    console.error("Could not mark subscription as active:", error.message);
    return NextResponse.json({ error: "Could not confirm payment. Contact support." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
