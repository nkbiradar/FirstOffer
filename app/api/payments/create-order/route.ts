import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRazorpayClient, CONTACT_UNLOCK_PRICE_PAISE } from "@/lib/payments/razorpay";

// Starts a Razorpay order for unlocking one opportunity's HR contact info.
// Any signed-in user (not admin-gated) — mirrors app/api/applications/
// route.ts's shape. Uses the service-role client (not the RLS-scoped one)
// because it needs to read an opportunity regardless of who's asking and
// upsert an opportunity_unlocks row keyed by a user_id it already trusts
// from the verified session, the same way the admin write paths do.
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: { opportunityId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const opportunityId = typeof body.opportunityId === "string" ? body.opportunityId : "";
  if (!opportunityId) {
    return NextResponse.json({ error: "opportunityId is required." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: opportunity, error: opportunityError } = await admin
    .from("opportunities")
    .select("id, hr_email, hr_contact, status")
    .eq("id", opportunityId)
    .maybeSingle();

  if (opportunityError || !opportunity || opportunity.status !== "published") {
    return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
  }
  if (!opportunity.hr_email && !opportunity.hr_contact) {
    return NextResponse.json({ error: "Nothing to unlock for this opportunity." }, { status: 400 });
  }

  const { data: existing } = await admin
    .from("opportunity_unlocks")
    .select("status")
    .eq("user_id", user.id)
    .eq("opportunity_id", opportunityId)
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
      notes: { user_id: user.id, opportunity_id: opportunityId, purpose: "contact_unlock" },
    });
  } catch (err) {
    console.error("Razorpay order creation failed:", err);
    return NextResponse.json({ error: "Could not start payment. Try again." }, { status: 502 });
  }

  const { error: upsertError } = await admin.from("opportunity_unlocks").upsert(
    {
      user_id: user.id,
      opportunity_id: opportunityId,
      razorpay_order_id: order.id,
      amount_paise: CONTACT_UNLOCK_PRICE_PAISE,
      status: "created",
    },
    { onConflict: "user_id,opportunity_id" },
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
