import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRazorpayClient, type SubscriptionProduct } from "@/lib/payments/razorpay";

// Lets a signed-in user cancel their OWN active subscription from
// /dashboard — for either product (`product` in the POST body, defaults
// to "full_access"), since a user can hold an active row of each
// independently and cancelling one must never touch the other. Cancels at
// cycle end (not immediately) — fairer than cutting off access the moment
// they click cancel when they've already paid for the current period.
// Access actually flips off later, when Razorpay's
// subscription.cancelled/halted webhook arrives (see
// app/api/payments/webhook/route.ts) — this route just records the
// cancellation intent and asks Razorpay to stop future charges.
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: { product?: string } = {};
  try {
    body = await request.json();
  } catch {
    // No body is fine — defaults to full_access below.
  }
  const product: SubscriptionProduct = body.product === "internal_hr" ? "internal_hr" : "full_access";

  const admin = createAdminClient();
  const { data: subscription, error: fetchError } = await admin
    .from("subscriptions")
    .select("id, razorpay_subscription_id, status")
    .eq("user_id", user.id)
    .eq("product", product)
    .eq("status", "active")
    .maybeSingle();

  if (fetchError) {
    console.error("Could not look up subscription to cancel:", fetchError.message);
    return NextResponse.json({ error: "Could not cancel. Try again." }, { status: 500 });
  }
  if (!subscription) {
    return NextResponse.json({ error: "No active subscription found." }, { status: 404 });
  }

  try {
    const razorpay = getRazorpayClient();
    // cancelAtCycleEnd = true: keep access until the period already paid
    // for actually ends, instead of revoking it the instant they click.
    await razorpay.subscriptions.cancel(subscription.razorpay_subscription_id, true);
  } catch (err) {
    console.error("Razorpay subscription cancellation failed:", err);
    return NextResponse.json({ error: "Could not cancel. Try again." }, { status: 502 });
  }

  const { error: updateError } = await admin
    .from("subscriptions")
    .update({ cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", subscription.id);

  if (updateError) {
    console.error("Could not record cancellation:", updateError.message);
  }

  return NextResponse.json({ ok: true });
}
