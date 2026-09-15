import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRazorpayClient, getMonthlyPlanId, MONTHLY_PRICE_PAISE, MONTHLY_SUBSCRIPTION_TOTAL_COUNT } from "@/lib/payments/razorpay";
import { checkRateLimit } from "@/lib/rate-limit";
import { hasFullAccess } from "@/lib/data/opportunity-unlocks";

// Starts a Razorpay Subscription for the current ₹49/month full-access
// plan — the recurring replacement for the old one-time
// app/api/payments/create-order/route.ts. Any signed-in user, same
// shape/conventions as that route (service-role client, per-user rate
// limit), but hits razorpay.subscriptions.create() with a plan_id instead
// of razorpay.orders.create() with a raw amount, since recurring billing
// on Razorpay only exists through a Plan.
export async function POST() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { allowed } = await checkRateLimit(`create-subscription:${user.id}`, {
    windowSeconds: 60,
    maxHits: 10,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 },
    );
  }

  // Covers BOTH the legacy lifetime unlock and an already-active
  // subscription — no point starting a second subscription for someone
  // who already has full access either way.
  if (await hasFullAccess(user.id)) {
    return NextResponse.json({ alreadyUnlocked: true });
  }

  const admin = createAdminClient();

  let subscription;
  try {
    const razorpay = getRazorpayClient();
    subscription = await razorpay.subscriptions.create({
      plan_id: getMonthlyPlanId(),
      total_count: MONTHLY_SUBSCRIPTION_TOTAL_COUNT,
      customer_notify: 1,
      notes: { user_id: user.id, purpose: "monthly_full_access" },
    });
  } catch (err) {
    console.error("Razorpay subscription creation failed:", err);
    return NextResponse.json({ error: "Could not start payment. Try again." }, { status: 502 });
  }

  const { error: upsertError } = await admin.from("subscriptions").upsert(
    {
      user_id: user.id,
      razorpay_subscription_id: subscription.id,
      razorpay_plan_id: getMonthlyPlanId(),
      amount_paise: MONTHLY_PRICE_PAISE,
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
