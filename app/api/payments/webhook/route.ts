import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

// Reliability backstop for BOTH payment flows — independent of the
// client-side calls in app/api/payments/verify and
// app/api/subscriptions/verify, which are skipped if the browser tab
// closes or loses network right after a successful payment. Configure in
// the Razorpay Dashboard -> Settings -> Webhooks: URL =
// https://<your-domain>/api/payments/webhook, secret = whatever you set
// RAZORPAY_WEBHOOK_SECRET to, events = "payment.captured" (legacy one-time
// unlock) plus "subscription.activated", "subscription.charged",
// "subscription.cancelled", "subscription.halted", "subscription.completed"
// (recurring monthly plan).
//
// Note: Razorpay's servers can't reach a plain `localhost` URL, so this
// route only matters once the site has a public URL — for local dev, the
// client-side verify calls are what actually confirm payments.
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("RAZORPAY_WEBHOOK_SECRET is not set — rejecting webhook.");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  if (expectedSignature !== signature) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let payload: {
    event?: string;
    payload?: {
      payment?: { entity?: { id?: string; order_id?: string; notes?: Record<string, string> } };
      subscription?: { entity?: { id?: string; status?: string; current_end?: number } };
    };
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const admin = createAdminClient();

  if (payload.event === "payment.captured") {
    // Legacy one-time full-access unlock. New purchases no longer go
    // through this path (see app/api/payments/create-order/route.ts is
    // no longer linked from the UI), but existing customers' historical
    // rows still flow through it.
    const payment = payload.payload?.payment?.entity;
    const orderId = payment?.order_id;
    const paymentId = payment?.id;
    const userId = payment?.notes?.user_id;

    if (!orderId || !paymentId || !userId) {
      console.error("Webhook payload missing expected fields (payment.captured).");
      return NextResponse.json({ ok: true });
    }

    const { error } = await admin
      .from("opportunity_unlocks")
      .update({
        razorpay_payment_id: paymentId,
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("razorpay_order_id", orderId);

    if (error) {
      console.error("Webhook: could not mark opportunity_unlocks as paid:", error.message);
    }
    return NextResponse.json({ ok: true });
  }

  const SUBSCRIPTION_EVENTS = new Set([
    "subscription.activated",
    "subscription.charged",
    "subscription.cancelled",
    "subscription.halted",
    "subscription.completed",
  ]);
  if (SUBSCRIPTION_EVENTS.has(payload.event ?? "")) {
    const subscriptionEntity = payload.payload?.subscription?.entity;
    const subscriptionId = subscriptionEntity?.id;
    if (!subscriptionId) {
      console.error("Webhook payload missing subscription id:", payload.event);
      return NextResponse.json({ ok: true });
    }

    // Map Razorpay's event name to the status our `subscriptions` table
    // uses — activated/charged both mean "the plan is live and paid up",
    // the rest map 1:1 to our own status column (see supabase/schema.sql).
    const status =
      payload.event === "subscription.activated" || payload.event === "subscription.charged"
        ? "active"
        : payload.event === "subscription.cancelled"
          ? "cancelled"
          : payload.event === "subscription.halted"
            ? "halted"
            : "completed";

    const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (typeof subscriptionEntity?.current_end === "number") {
      // Razorpay sends Unix seconds; current_period_end is only ever used
      // for display ("renews on ...") PLUS — since isSubscriptionAccessActive()
      // in lib/data/subscriptions.ts — as the grace-period cutoff for a
      // 'cancelled' row, so keep it accurate even on a cancellation event.
      update.current_period_end = new Date(subscriptionEntity.current_end * 1000).toISOString();
    }
    // A subscription reaching any of these terminal statuses stops
    // renewing regardless of how it got there (customer-initiated cancel
    // via /dashboard, a revoked UPI Autopay mandate, or failed renewal
    // retries) — recorded the same way app/api/subscriptions/cancel/route.ts
    // does for the in-app cancel flow, so /dashboard's "Cancelled — access
    // ends ..." messaging is accurate no matter which flow triggered it.
    // Access itself isn't cut off here: for 'cancelled' specifically,
    // isSubscriptionAccessActive() keeps the customer's access live until
    // current_period_end passes, honoring whatever they already paid for.
    if (status === "cancelled" || status === "halted" || status === "completed") {
      update.cancelled_at = new Date().toISOString();
    }
    // subscription.activated/charged events also carry the payment that
    // triggered them — recorded so a row here can be matched back to an
    // exact entry in the Razorpay dashboard's Payments list (see the
    // razorpay_payment_id/razorpay_order_id note in supabase/schema.sql).
    // Always reflects the LATEST charge, not a history of every renewal.
    const webhookPayment = payload.payload?.payment?.entity;
    if (webhookPayment?.id) {
      update.razorpay_payment_id = webhookPayment.id;
    }
    if (webhookPayment?.order_id) {
      update.razorpay_order_id = webhookPayment.order_id;
    }

    const { error } = await admin.from("subscriptions").update(update).eq("razorpay_subscription_id", subscriptionId);
    if (error) {
      console.error(`Webhook: could not update subscription (${payload.event}):`, error.message);
    }
    return NextResponse.json({ ok: true });
  }

  // Not an event we act on — acknowledge so Razorpay doesn't retry it.
  return NextResponse.json({ ok: true });
}
