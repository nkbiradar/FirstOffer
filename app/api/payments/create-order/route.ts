import { NextResponse } from "next/server";

// RETIRED — full access is now sold as a ₹49/month recurring subscription
// (see app/api/subscriptions/create/route.ts and
// components/UnlockContactCard.tsx, which no longer calls this route).
// Kept as a disabled stub rather than deleted so the route path itself
// still resolves (returning a clear error) instead of a bare 404 for
// anything still pointing at it. app/api/payments/verify/route.ts and the
// payment.captured branch of app/api/payments/webhook/route.ts stay fully
// active — they service historical rows for customers who already
// completed a one-time purchase before this change, who keep lifetime
// access (see lib/data/opportunity-unlocks.ts's hasFullAccess()).
export async function POST() {
  return NextResponse.json(
    { error: "This is no longer available. Full access is now a ₹49/month membership." },
    { status: 410 },
  );
}
