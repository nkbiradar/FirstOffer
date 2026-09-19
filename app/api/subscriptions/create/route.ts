import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getRazorpayClient,
  getProductPricing,
  MANUAL_PLAN_MARKER,
  type SubscriptionProduct,
} from "@/lib/payments/razorpay";
import { checkRateLimit } from "@/lib/rate-limit";
import { hasFullAccess } from "@/lib/data/opportunity-unlocks";
import { hasInternalAccess } from "@/lib/data/subscriptions";

// Starts a payment for one of the two products this site sells — the
// ₹49/month full-access plan or the ₹39/month Internal HR Openings plan,
// chosen by the `product` field in the POST body (defaults to
// "full_access" for existing callers that don't send one).
//
// This used to create a Razorpay Subscription (recurring UPI Autopay/card
// e-mandate, billed automatically every month). Switched to a plain
// one-time Order after real customers kept abandoning checkout at the
// mandate-authorization step specifically — Autopay asks for an extra
// "authorize this recurring mandate" approval that a lot of first-time UPI
// users don't expect, on top of the payment itself, and Razorpay reports
// that step as a `payment_cancelled` failure indistinguishable from the
// customer just changing their mind. A plain Order is one approval, not
// two, so it can't fail at a step that no longer exists. The real
// trade-off: this doesn't auto-renew — see isSubscriptionAccessActive() in
// lib/data/subscriptions.ts for how a paid `subscriptions` row now grants
// access for exactly 30 days and then quietly lapses, and
// components/UnlockContactCard.tsx's copy, which is honest with the
// customer that they need to pay again next month.
//
// Reuses the `subscriptions` table as-is (no schema change): the
// razorpay_subscription_id column — kept NOT NULL + UNIQUE for the old
// Autopay flow — now holds this Order's id instead of a real subscription
// id. The two are easy to tell apart later (a real one starts "sub_", an
// order starts "order_") — see app/api/subscriptions/cancel/route.ts,
// which uses exactly that to keep working for anyone who subscribed before
// this switch. razorpay_plan_id (also NOT NULL) is set to the literal
// MANUAL_PLAN_MARKER since there's no real Plan behind a one-time Order.
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: { product?: string } = {};
  try {
    body = await request.json();
  } catch {
    // No body (or invalid JSON) is fine — defaults to full_access below,
    // matching every call site that existed before this product param.
  }
  const product: SubscriptionProduct = body.product === "internal_hr" ? "internal_hr" : "full_access";

  const { allowed } = await checkRateLimit(`create-subscription:${product}:${user.id}`, {
    windowSeconds: 60,
    maxHits: 10,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 },
    );
  }

  // For full_access: covers BOTH the legacy lifetime unlock and an
  // already-active (still within its 30-day window, or a still-valid
  // grandfathered Autopay row) subscription. For internal_hr: this product
  // has no legacy lifetime equivalent, so it's just the active check.
  const alreadyHasAccess =
    product === "internal_hr" ? await hasInternalAccess(user.id) : await hasFullAccess(user.id);
  if (alreadyHasAccess) {
    return NextResponse.json({ alreadyUnlocked: true });
  }

  const admin = createAdminClient();
  const { pricePaise, description } = getProductPricing(product);

  let order;
  try {
    const razorpay = getRazorpayClient();
    order = await razorpay.orders.create({
      amount: pricePaise,
      currency: "INR",
      notes: { user_id: user.id, product },
    });
  } catch (err) {
    console.error("Razorpay order creation failed:", err);
    return NextResponse.json({ error: "Could not start payment. Try again." }, { status: 502 });
  }

  const { error: insertError } = await admin.from("subscriptions").insert({
    user_id: user.id,
    product,
    razorpay_subscription_id: order.id,
    razorpay_plan_id: MANUAL_PLAN_MARKER,
    amount_paise: pricePaise,
    status: "created",
  });

  if (insertError) {
    console.error("Could not save subscription record:", insertError.message);
    return NextResponse.json({ error: "Could not start payment. Try again." }, { status: 500 });
  }

  return NextResponse.json({
    orderId: order.id,
    amount: pricePaise,
    keyId: process.env.RAZORPAY_KEY_ID,
    description,
  });
}
