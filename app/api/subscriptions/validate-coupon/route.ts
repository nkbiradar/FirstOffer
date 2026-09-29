import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/supabase/auth";
import { getProductPricing, type SubscriptionProduct } from "@/lib/payments/razorpay";
import { hasLegacyFullAccessPricing } from "@/lib/data/subscriptions";
import { applyCouponDiscount, validateCouponForCheckout } from "@/lib/payments/coupons";
import { checkRateLimit } from "@/lib/rate-limit";

// Lets components/UnlockContactCard.tsx show the discounted price live
// (e.g. "₹79 instead of ₹99") before Razorpay Checkout even opens, without
// duplicating the actual validation rules — this calls the exact same
// validateCouponForCheckout() that app/api/subscriptions/create/route.ts
// uses for the real charge, so a code that previews as valid here is
// guaranteed to still be valid there (short of a race, which create/
// route.ts re-checks anyway).
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ valid: false, error: "Sign in required." }, { status: 401 });
  }

  const { allowed } = await checkRateLimit(`validate-coupon:${user.id}`, {
    windowSeconds: 60,
    maxHits: 20,
  });
  if (!allowed) {
    return NextResponse.json({ valid: false, error: "Too many attempts. Try again shortly." }, { status: 429 });
  }

  let body: { code?: string; product?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ valid: false, error: "Invalid request." }, { status: 400 });
  }

  const code = typeof body.code === "string" ? body.code.trim() : "";
  const product: SubscriptionProduct = body.product === "internal_hr" ? "internal_hr" : "full_access";

  if (!code) {
    return NextResponse.json({ valid: false, error: "Enter a coupon code." }, { status: 400 });
  }

  const result = await validateCouponForCheckout(code, product, user.id);
  if (!result.valid || !result.coupon) {
    return NextResponse.json({ valid: false, error: result.error ?? "Invalid coupon." });
  }

  const isLegacyFullAccess = product === "full_access" && (await hasLegacyFullAccessPricing(user.id));
  const { pricePaise, priceInr } = getProductPricing(product, isLegacyFullAccess);
  const discountedPaise = applyCouponDiscount(pricePaise, result.coupon);

  return NextResponse.json({
    valid: true,
    code: result.coupon.code,
    originalPaise: pricePaise,
    originalInr: priceInr,
    discountedPaise,
    discountedInr: Math.round(discountedPaise / 100),
  });
}
