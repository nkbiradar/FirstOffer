import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyRazorpaySignature } from "@/lib/payments/verify-signature";

// Called by the browser right after Razorpay Checkout's success handler
// fires (see components/UnlockContactCard.tsx). This is the fast path —
// app/api/payments/webhook/route.ts is the reliability backstop for when
// this call never happens (tab closed, network drop right after paying).
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    opportunityId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, opportunityId } = body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !opportunityId) {
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
  const { error } = await admin
    .from("opportunity_unlocks")
    .update({
      razorpay_payment_id,
      status: "paid",
      paid_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("opportunity_id", opportunityId)
    .eq("razorpay_order_id", razorpay_order_id);

  if (error) {
    console.error("Could not mark unlock as paid:", error.message);
    return NextResponse.json({ error: "Could not confirm payment. Contact support." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
