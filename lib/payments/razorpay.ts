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

// Current pricing: ₹49/month, billed on Razorpay's Subscriptions API
// (recurring UPI Autopay or card e-mandate), not the one-time Orders API
// above. See app/api/subscriptions/create/route.ts.
export const MONTHLY_PRICE_INR = 49;
export const MONTHLY_PRICE_PAISE = MONTHLY_PRICE_INR * 100;

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
