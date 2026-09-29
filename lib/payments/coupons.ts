// Discount-code system shared by app/api/subscriptions/validate-coupon
// (price preview before checkout opens) and app/api/subscriptions/create
// (the real charge) — both call validateCouponForCheckout() below so
// "is this coupon usable right now" can never disagree between the two.
// See supabase/schema.sql's coupons/coupon_redemptions tables for the
// full design rationale (built for the ALGOCRUX partner coupon).
import { createAdminClient } from "@/lib/supabase/admin";
import type { SubscriptionProduct } from "@/lib/payments/razorpay";

export type Coupon = {
  id: string;
  code: string;
  product: SubscriptionProduct | "all";
  discount_type: "flat" | "percent";
  discount_value: number;
  first_time_only: boolean;
  active: boolean;
  partner_label: string | null;
};

/**
 * Looks up an active coupon by code for one product — service-role only
 * (coupons has RLS enabled with no public policies; a coupon's existence
 * or discount is never something the browser queries directly). Matches
 * case-insensitively: codes are stored upper-cased, and this upper-cases
 * the input too, so "algocrux" and "ALGOCRUX" both work. A coupon scoped
 * to `product: "all"` matches every product; one scoped to a specific
 * product only matches that one.
 */
export async function findCoupon(code: string, product: SubscriptionProduct): Promise<Coupon | null> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("coupons")
    .select("id, code, product, discount_type, discount_value, first_time_only, active, partner_label")
    .eq("code", normalized)
    .eq("active", true)
    .in("product", [product, "all"])
    .maybeSingle();

  if (error) {
    console.error("findCoupon failed:", error.message);
    return null;
  }
  return data as Coupon | null;
}

/**
 * Whether this user has never completed a real payment for this product —
 * the gate for a `first_time_only` coupon like ALGOCRUX (flat ₹20 off,
 * first month only). Mirrors hasLegacyFullAccessPricing()'s existing "any
 * completed payment on record" check in lib/data/subscriptions.ts, minus
 * the price filter. Fails CLOSED (treats an error as "not first-time", i.e.
 * no discount) — same reasoning as hasLegacyFullAccessPricing: a wrong
 * answer here has a direct revenue consequence, so a DB hiccup should
 * never accidentally hand out an unearned discount.
 */
export async function isFirstTimeSubscriber(userId: string, product: SubscriptionProduct): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("product", product)
    .not("razorpay_payment_id", "is", null)
    .limit(1);

  if (error) {
    console.error("isFirstTimeSubscriber failed:", error.message);
    return false;
  }
  return (data ?? []).length === 0;
}

/**
 * Whether this user has already redeemed this specific coupon — stops the
 * same user redeeming the same coupon twice (e.g. retrying after an
 * abandoned checkout that already recorded a redemption). Fails CLOSED
 * (treats an error as "already redeemed") for the same revenue-safety
 * reason as isFirstTimeSubscriber above.
 */
export async function hasRedeemedCoupon(userId: string, couponId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("coupon_redemptions")
    .select("id")
    .eq("user_id", userId)
    .eq("coupon_id", couponId)
    .limit(1);

  if (error) {
    console.error("hasRedeemedCoupon failed:", error.message);
    return true;
  }
  return (data ?? []).length > 0;
}

/**
 * Applies a coupon's discount to a base price, in paise. Flat coupons
 * subtract a fixed paise amount (never below 0); percent coupons take a
 * percentage off, rounded to the nearest paise.
 */
export function applyCouponDiscount(
  pricePaise: number,
  coupon: Pick<Coupon, "discount_type" | "discount_value">,
): number {
  if (coupon.discount_type === "percent") {
    const pct = Math.min(100, Math.max(0, coupon.discount_value));
    return Math.max(0, Math.round(pricePaise * (1 - pct / 100)));
  }
  return Math.max(0, pricePaise - coupon.discount_value);
}

/**
 * Full checkout-time validation for a coupon code — the single place both
 * the price-preview endpoint and the real order-creation endpoint call, so
 * they can never disagree about whether a coupon is usable right now.
 */
export async function validateCouponForCheckout(
  code: string,
  product: SubscriptionProduct,
  userId: string,
): Promise<{ valid: boolean; coupon: Coupon | null; error?: string }> {
  const coupon = await findCoupon(code, product);
  if (!coupon) {
    return { valid: false, coupon: null, error: "That coupon code isn't valid." };
  }

  if (coupon.first_time_only) {
    const firstTime = await isFirstTimeSubscriber(userId, product);
    if (!firstTime) {
      return { valid: false, coupon: null, error: "This coupon is for first-time subscribers only." };
    }
  }

  const alreadyRedeemed = await hasRedeemedCoupon(userId, coupon.id);
  if (alreadyRedeemed) {
    return { valid: false, coupon: null, error: "You've already used this coupon." };
  }

  return { valid: true, coupon };
}

/**
 * Records a successful coupon redemption — called by
 * app/api/subscriptions/verify/route.ts right after a coupon-discounted
 * payment is confirmed. Each row here is exactly the attribution count a
 * partner (e.g. Algocrux) wants: "how many of our users actually signed up
 * and paid." Silently ignores a duplicate-key error (unique on
 * (coupon_id, user_id)) rather than failing the whole verify call — the
 * payment itself already succeeded by this point, so a redemption-logging
 * hiccup should never surface as an error to a paying customer.
 */
export async function recordCouponRedemption(
  couponId: string,
  userId: string,
  razorpayOrderId: string,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("coupon_redemptions")
    .insert({ coupon_id: couponId, user_id: userId, razorpay_order_id: razorpayOrderId });

  if (error && error.code !== "23505") {
    console.error("recordCouponRedemption failed:", error.message);
  }
}
