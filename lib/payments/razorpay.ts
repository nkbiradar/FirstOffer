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
// Since Oct 2026 this ₹99 buys 3 months (FULL_ACCESS_PERIOD_MS), not one.
// 16 Oct 2026: raised to ₹199 for 3 months.
export const MONTHLY_PRICE_INR = 199;
export const MONTHLY_PRICE_PAISE = MONTHLY_PRICE_INR * 100;

// ── Dasara offer (Oct 2026): full access ₹49 instead of ₹99, same 3 months.
// Switches itself off at DASARA_SALE_ENDS_AT — no redeploy needed.
export const DASARA_SALE_PRICE_INR = 49;
export const DASARA_SALE_ENDS_AT = "2026-10-20T23:59:59+05:30";
export const DASARA_SALE_END_LABEL = "20 Oct";

export function isDasaraSaleActive(now: number = Date.now()): boolean {
  return now < Date.parse(DASARA_SALE_ENDS_AT);
}

// ── Diwali offer (30 Oct – 8 Nov 2026): full access shown as ₹299 → ₹149,
// same 3 months. ₹149 is what is actually charged (getFullAccessPriceInr →
// getProductPricing → Razorpay order); ₹299 is the display-only struck-through
// price. Switches itself off at FULL_ACCESS_SALE_ENDS_AT, after which the
// price goes back to the regular ₹199 (MONTHLY_PRICE_INR) — no redeploy needed.
// (Previous use of this slot: "800+ students" offer, ₹149, 22–29 Oct.)
export const FULL_ACCESS_SALE_PRICE_INR = 149;
/** Struck-through "was" price shown beside the offer price. Display only. */
export const FULL_ACCESS_SALE_MRP_INR = 299;
export const FULL_ACCESS_SALE_ENDS_AT = "2026-11-08T23:59:59+05:30";
/** Last day of the offer ("till 8 Nov"). */
export const FULL_ACCESS_SALE_END_LABEL = "8 Nov";
/** First day after the offer. */
export const FULL_ACCESS_SALE_BACK_LABEL = "9 Nov";
export const FULL_ACCESS_SALE_TITLE = "Diwali Offer 🪔";

export function isFullAccessSaleActive(now: number = Date.now()): boolean {
  return now < Date.parse(FULL_ACCESS_SALE_ENDS_AT);
}

// ── 2-day offer: full access ₹199 (regular ₹399) until 20 Oct 2026, 23:59 IST.
// After FULL_ACCESS_PRICE_RISE_AT the strike-through and countdown are hidden
// and the price stays ₹199.
export const FULL_ACCESS_NEXT_PRICE_INR = 399;
export const FULL_ACCESS_PRICE_RISE_AT = "2026-10-21T00:00:00+05:30";
/** Last day of the offer (shown as "ends 20 Oct"). */
export const FULL_ACCESS_PRICE_RISE_LABEL = "20 Oct";

/** True until the announced ₹199 → ₹299 rise takes effect. */
export function isFullAccessPriceRisePending(now: number = Date.now()): boolean {
  return now < Date.parse(FULL_ACCESS_PRICE_RISE_AT);
}

/** The full-access price to show and charge right now. */
export function getFullAccessPriceInr(now: number = Date.now()): number {
  if (isFullAccessSaleActive(now)) return FULL_ACCESS_SALE_PRICE_INR;
  // Price stays ₹199 after the offer ends (Oct 2026 decision); the ₹399
  // strike-through and countdown simply disappear once the offer is over.
  return MONTHLY_PRICE_INR;
}

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

// ── Internal HR Openings (a second, independent ₹149/month product; was ₹79 until Oct 2026) ─────
// Same Subscriptions-API mechanics as the ₹49/month full-access plan
// above, but its own Plan, its own price, and its own access dimension —
// a user can hold neither, either, or both. See lib/data/subscriptions.ts
// (hasActiveSubscription is parameterized by product) and
// app/internal-openings/page.tsx.
// 25 Oct 2026: raised from ₹149 to ₹299 for 3 months.
export const INTERNAL_PRICE_INR = 299;
export const INTERNAL_PRICE_PAISE = INTERNAL_PRICE_INR * 100;

// Diwali offer (same window as the full-access Diwali offer above): Internal
// HR shown as ₹399 → ₹299. Display only — the charge stays INTERNAL_PRICE_INR.
// The strike-through disappears by itself when the offer window ends.
export const INTERNAL_SALE_MRP_INR = 399;

/** True during the Diwali offer window (shared by Full Access and Internal HR). */
export function isDiwaliOfferActive(now: number = Date.now()): boolean {
  return isFullAccessSaleActive(now);
}

// Dasara offer for Internal HR: ₹99 instead of ₹149 (same window as full access).
export const DASARA_INTERNAL_SALE_PRICE_INR = 99;

/** The Internal HR price to show and charge right now (₹99 during the old sale, else INTERNAL_PRICE_INR). */
export function getInternalPriceInr(now: number = Date.now()): number {
  return isDasaraSaleActive(now) ? DASARA_INTERNAL_SALE_PRICE_INR : INTERNAL_PRICE_INR;
}

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
    const internalPriceInr = getInternalPriceInr();
    return {
      priceInr: internalPriceInr,
      pricePaise: internalPriceInr * 100,
      description: isDasaraSaleActive()
        ? "Internal HR Openings — 3 months access (Dasara offer)"
        : "Internal HR Openings — 3 months access",
    };
  }
  // Founding members (isLegacyFullAccess) used to keep ₹49/month; since
  // the switch to ₹99 for 3 months (₹33/month) everyone pays the same,
  // which is already below their old rate. The flag is kept for callers.
  void isLegacyFullAccess;
  const priceInr = getFullAccessPriceInr();
  return {
    priceInr,
    pricePaise: priceInr * 100,
    description: isFullAccessSaleActive() ? "Full access — 3 months (Diwali offer)" : "Full access — 3 months",
  };
}

/** Every manual (non-Autopay) subscription row stores this in place of a
 * real Razorpay Plan id, since there is no plan behind a one-time Order. */
export const MANUAL_PLAN_MARKER = "manual";

/** Old 30-day access period (no longer used for new payments). */
export const MANUAL_ACCESS_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

/** Access period bought by a single full-access payment (3 months). */
export const FULL_ACCESS_PERIOD_MS = 90 * 24 * 60 * 60 * 1000;

/** How long one payment for `product` unlocks access. Since Oct 2026
 * both products (full access ₹99, Internal HR ₹149) buy 3 months. */
export function getAccessPeriodMs(product: string | null | undefined): number {
  void product;
  return FULL_ACCESS_PERIOD_MS;
}

// ── Resume Makeover (one-time ₹99 service, see app/resume) ─────────────
// A one-off human service, not a subscription: the student pays once,
// uploads their current resume, and the team rewrites it. Lives in its own
// `resume_orders` table (supabase/schema.sql) — never touches
// `subscriptions`, so it can't accidentally grant site access.
export const RESUME_REVIEW_PRICE_INR = 99;
// Shown struck-through next to the price as the "original" price (offer badge).
export const RESUME_REVIEW_MRP_INR = 199;
export const RESUME_REVIEW_PRICE_PAISE = RESUME_REVIEW_PRICE_INR * 100;
