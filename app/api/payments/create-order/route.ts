import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRazorpayClient, CONTACT_UNLOCK_PRICE_PAISE } from "@/lib/payments/razorpay";
import { checkRateLimit } from "@/lib/rate-limit";

// Starts a Razorpay order for one-time platform access — unlocks
// every company's application link, HR email, and contact on FirstOffer.
// All future opportunities included. Any signed-in user (not admin-gated).
// Uses the service-role client because it needs to upsert a user_access
// row keyed by a user_id it already trusts from the verified session.
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  // Each call hits the Razorpay API and writes a row, so cap how often one
  // user can start orders — 10 per minute is generous for a real checkout
  // flow (which only calls this once per unlock attempt) but blocks a
  // scripted hammering of this endpoint. Keyed per-user, not per-IP, since
  // the route already requires a signed-in session.
  const { allowed } = await checkRateLimit(`create-order:${user.id}`, {
    windowSeconds: 60,
    maxHits: 10,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 },
    );
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("user_access")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.status === "paid") {
    return NextResponse.json({ alreadyUnlocked: true });
  }

  let order;
  try {
    const razorpay = getRazorpayClient();
    order = await razorpay.orders.create({
      amount: CONTACT_UNLOCK_PRICE_PAISE,
      currency: "INR",
      notes: { user_id: user.id, purpose: "platform_access" },
    });
  } catch (err) {
    console.error("Razorpay order creation failed:", err);
    return NextResponse.json({ error: "Could not start payment. Try again." }, { status: 502 });
  }

  const { error: upsertError } = await admin.from("user_access").upsert(
    {
      user_id: user.id,
      razorpay_order_id: order.id,
      amount_paise: CONTACT_UNLOCK_PRICE_PAISE,
      status: "created",
    },
    { onConflict: "user_id" },
  );

  if (upsertError) {
    console.error("Could not save order record:", upsertError.message);
    return NextResponse.json({ error: "Could not start payment. Try again." }, { status: 500 });
  }

  return NextResponse.json({
    orderId: order.id,
    amount: CONTACT_UNLOCK_PRICE_PAISE,
    currency: "INR",
    keyId: process.env.RAZORPAY_KEY_ID,
  });
}
