import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

// Reliability backstop for the platform-access payment flow — independent
// of the client-side call in app/api/payments/verify/route.ts, which is
// skipped if the browser tab closes or loses network right after a
// successful payment. Configure this in the Razorpay Dashboard -> Settings
// -> Webhooks: URL = https://<your-domain>/api/payments/webhook, event =
// "payment.captured", secret = whatever you set RAZORPAY_WEBHOOK_SECRET to.
//
// Note: Razorpay's servers can't reach a plain `localhost` URL, so this
// route only matters once the site has a public URL — for local dev, the
// client-side verify call above is what actually confirms payments.
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
    payload?: { payment?: { entity?: { id?: string; order_id?: string; notes?: Record<string, string> } } };
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (payload.event !== "payment.captured") {
    // Not an event we act on — acknowledge so Razorpay doesn't retry it.
    return NextResponse.json({ ok: true });
  }

  const payment = payload.payload?.payment?.entity;
  const orderId = payment?.order_id;
  const paymentId = payment?.id;
  const notes = payment?.notes ?? {};
  const userId = notes.user_id;

  if (!orderId || !paymentId || !userId) {
    console.error("Webhook payload missing expected fields.");
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("user_access")
    .update({
      razorpay_payment_id: paymentId,
      status: "paid",
      paid_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("razorpay_order_id", orderId);

  if (error) {
    console.error("Webhook: could not mark platform access as paid:", error.message);
  }

  return NextResponse.json({ ok: true });
}
