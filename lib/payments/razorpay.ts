// Server-only Razorpay wrapper for the "platform access" payment flow
// (one-time fee, unlocks everything). Never import this from a Client
// Component — it needs RAZORPAY_KEY_SECRET, which must never reach the
// browser.
import Razorpay from "razorpay";

let cachedClient: Razorpay | null = null;

export function getRazorpayClient(): Razorpay {
  if (cachedClient) return cachedClient;

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET.");
  }

  cachedClient = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return cachedClient;
}

// Legacy one-time price for full platform access — no longer sold to new
// customers (see MONTHLY_PRICE_INR below), but kept so existing lifetime
// buyers' historical opportunity_unlocks rows (and hasFullAccess's
// grandfathering check) keep meaning something. UPI-only at checkout.
export const CONTACT_UNLOCK_PRICE_INR = 49;
export const CONTACT_UNLOCK_PRICE_PAISE = CONTACT_UNLOCK_PRICE_INR * 100;

// Regular price for a brand-new full_access subscriber, from the ₹49→₹99
// price update. Originally billed on Razorpay's Subscriptions API
// (recurring UPI Autopay/card e-mandate); new purchases are now a one-time
// Order instead (see app/api/subscriptions/create/route.ts) — this constant
// is the display/checkout price for anyone with no prior full_access
// payment on record. Existing early subscribers do NOT pay this — see
// LEGACY_MONTHLY_PRICE_INR and getFullAccessPricing() below.
export const MONTHLY_PRICE_INR = 99;
export const MONTHLY_PRICE_PAISE = MONTHLY_PRICE_INR * 100;

// The founding-member rate: anyone who completed at least one full_access
// payment at this price before the ₹49→₹99 update keeps paying this price
// on every future renewal, for as long as they keep resubscribing — see
// hasLegacyFullAccessPricing() in lib/data/subscriptions.ts, which is what
// actually decides who qualifies. This constant is also what that check
// compares historical `amount_paise` rows against, so it must never change
// even after MONTHLY_PRICE_INR moves again in the future.
export const LEGACY_MONTHLY_PRICE_INR = 49;
export const LEGACY_MONTHLY_PRICE_PAISE = LEGACY_MONTHLY_PRICE_INR * 100;

// Razorpay subscriptions have no literal "until cancelled" option — every
// subscription needs a total_count of billing cycles. 120 monthly cycles
// (10 years) is the practical stand-in for "indefinite, until the user
// cancels" without the site inventing its own expiry logic.
export const MONTHLY_SUBSCRIPTION_TOTAL_COUNT = 120;

/**
 * The Razorpay Plan (`plan_...`) that every new monthly subscription is
 * created against. Plans aren't created per-checkout — this one is made
 * once (Razorpay Dashboard > Settings > Subscriptions > Plans, or via
 * razorpay.plans.create()) and its id is pasted into this env var. Kept as
 * a getter (not a top-level constant) so a missing env var throws a clear
 * error at the moment a subscription is actually attempted, not at import
 * time / build time.
 */
export function getMonthlyPlanId(): string {
  const planId = process.env.RAZORPAY_MONTHLY_PLAN_ID;
  if (!planId) {
    throw new Error("Missing RAZORPAY_MONTHLY_PLAN_ID.");
  }
  return planId;
}

// ── Internal HR Openings (a second, independent ₹39/month product) ──────
// Same Subscriptions-API mechanics as the ₹49/month full-access plan
// above, but its own Plan, its own price, and its own access dimension —
// a user can hold neither, either, or both. See lib/data/subscriptions.ts
// (hasActiveSubscription is parameterized by product) and
// app/internal-openings/page.tsx.
export const INTERNAL_PRICE_INR = 39;
export const INTERNAL_PRICE_PAISE = INTERNAL_PRICE_INR * 100;

export function getInternalPlanId(): string {
  const planId = process.env.RAZORPAY_INTERNAL_PLAN_ID;
  if (!planId) {
    throw new Error("Missing RAZORPAY_INTERNAL_PLAN_ID.");
  }
  return planId;
}

export type SubscriptionProduct = "full_access" | "internal_hr";

/**
 * Single lookup table for everything that differs between the two
 * subscription products — keeps the create/cancel API routes under
 * app/api/subscriptions and components/UnlockContactCard.tsx from each
 * hand-rolling their own product-to-plan/price mapping (and risking the
 * two falling out of sync).
 *
 * Kept as-is for any grandfathered Autopay row still being cancelled via
 * app/api/subscriptions/cancel/route.ts. New purchases no longer go
 * through Razorpay's Plan/Subscription APIs at all (see
 * getProductPricing() below) — this is why `planId` is still here but
 * nothing creates a new subscription against it anymore.
 */
export function getProductConfig(product: SubscriptionProduct): {
  planId: string;
  priceInr: number;
  pricePaise: number;
  description: string;
} {
  if (product === "internal_hr") {
    return {
      planId: getInternalPlanId(),
      priceInr: INTERNAL_PRICE_INR,
      pricePaise: INTERNAL_PRICE_PAISE,
      description: "Internal HR Openings membership",
    };
  }
  return {
    planId: getMonthlyPlanId(),
    priceInr: MONTHLY_PRICE_INR,
    pricePaise: MONTHLY_PRICE_PAISE,
    description: "Monthly membership — full site access",
  };
}

/**
 * Same price/description lookup as getProductConfig() above, but without
 * requiring a Razorpay Plan id — used by the current one-time-per-month
 * checkout (app/api/subscriptions/create/route.ts), which sells access via
 * a plain Order rather than a Subscription against a Plan. Plans/Autopay
 * are no longer used for new purchases (see that route's comment for why),
 * so this is the version new code should reach for.
 *
 * `isLegacyFullAccess` only matters for the full_access product — pass
 * whatever hasLegacyFullAccessPricing() (lib/data/subscriptions.ts) returns
 * for the paying user, so a founding-member subscriber gets ₹49 on this and
 * every future call, while everyone else gets the current ₹99 rate.
 * internal_hr has no such tiering and ignores the flag entirely.
 */
export function getProductPricing(
  product: SubscriptionProduct,
  isLegacyFullAccess = false,
): {
  priceInr: number;
  pricePaise: number;
  description: string;
} {
  if (product === "internal_hr") {
    return {
      priceInr: INTERNAL_PRICE_INR,
      pricePaise: INTERNAL_PRICE_PAISE,
      description: "Internal HR Openings — 30 days access",
    };
  }
  if (isLegacyFullAccess) {
    return {
      priceInr: LEGACY_MONTHLY_PRICE_INR,
      pricePaise: LEGACY_MONTHLY_PRICE_PAISE,
      description: "Full access — 30 days (founding-member price)",
    };
  }
  return {
    priceInr: MONTHLY_PRICE_INR,
    pricePaise: MONTHLY_PRICE_PAISE,
    description: "Full access — 30 days",
  };
}

/** Every manual (non-Autopay) subscription row stores this in place of a
 * real Razorpay Plan id, since there is no plan behind a one-time Order. */
export const MANUAL_PLAN_MARKER = "manual";

/** Access period bought by a single manual monthly payment. */
export const MANUAL_ACCESS_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;
