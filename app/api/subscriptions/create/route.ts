import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getRazorpayClient,
  getProductConfig,
  MONTHLY_SUBSCRIPTION_TOTAL_COUNT,
  type SubscriptionProduct,
} from "@/lib/payments/razorpay";
import { checkRateLimit } from "@/lib/rate-limit";
import { hasFullAccess } from "@/lib/data/opportunity-unlocks";
import { hasInternalAccess } from "@/lib/data/subscriptions";

// Starts a Razorpay Subscription for one of the two products this site
// sells — the ₹49/month full-access plan (the recurring replacement for
// the old one-time app/api/payments/create-order/route.ts) or the
// ₹39/month Internal HR Openings plan, chosen by the `product` field in
// the POST body (defaults to "full_access" for existing callers that
// don't send one). Any signed-in user, same shape/conventions as the old
// one-time route (service-role client, per-user rate limit), but hits
// razorpay.subscriptions.create() with a plan_id instead of
// razorpay.orders.create() with a raw amount, since recurring billing on
// Razorpay only exists through a Plan.
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
  // already-active subscription. For internal_hr: this product has no
  // legacy lifetime equivalent, so it's just the active-subscription check.
  const alreadyHasAccess =
    product === "internal_hr" ? await hasInternalAccess(user.id) : await hasFullAccess(user.id);
  if (alreadyHasAccess) {
    return NextResponse.json({ alreadyUnlocked: true });
  }

  const admin = createAdminClient();
  const { planId, pricePaise } = getProductConfig(product);

  let subscription;
  try {
    const razorpay = getRazorpayClient();
    subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: MONTHLY_SUBSCRIPTION_TOTAL_COUNT,
      customer_notify: 1,
      notes: { user_id: user.id, purpose: `monthly_${product}` },
    });
  } catch (err) {
    console.error("Razorpay subscription creation failed:", err);
    return NextResponse.json({ error: "Could not start payment. Try again." }, { status: 502 });
  }

  const { error: upsertError } = await admin.from("subscriptions").upsert(
    {
      user_id: user.id,
      product,
      razorpay_subscription_id: subscription.id,
      razorpay_plan_id: planId,
      amount_paise: pricePaise,
      status: "created",
    },
    { onConflict: "razorpay_subscription_id" },
  );

  if (upsertError) {
    console.error("Could not save subscription record:", upsertError.message);
    return NextResponse.json({ error: "Could not start payment. Try again." }, { status: 500 });
  }

  return NextResponse.json({
    subscriptionId: subscription.id,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
}
