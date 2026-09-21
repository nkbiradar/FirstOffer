// Reads for both recurring subscription products — the ₹49/month full
// access plan and the ₹39/month Internal HR Openings plan (see
// supabase/schema.sql's `subscriptions` table, which holds both, keyed
// apart by `product`). Existing lifetime buyers from the old one-time
// unlock are untouched and keep working through
// lib/data/opportunity-unlocks.ts's `opportunity_unlocks` check; this file
// only ever looks at the new table. Same convention as
// opportunity-unlocks.ts: the normal RLS-scoped client, fails soft so a
// page never crashes if the migration hasn't been applied yet.
import { createClient } from "@/lib/supabase/server";
import { LEGACY_MONTHLY_PRICE_PAISE, type SubscriptionProduct } from "@/lib/payments/razorpay";

export type UserSubscription = {
  status: "created" | "authenticated" | "active" | "pending" | "halted" | "cancelled" | "completed" | "expired";
  amount_paise: number;
  current_period_end: string | null;
  cancelled_at: string | null;
  razorpay_subscription_id: string;
};

/**
 * Whether a subscription row currently earns its holder access — the one
 * place both hasActiveSubscription() below and /dashboard's display logic
 * derive this from, so they can never disagree.
 *
 * As of the switch away from Razorpay Autopay (see
 * app/api/subscriptions/create/route.ts's comment on why: UPI Autopay's
 * extra mandate-authorization step was causing a lot of real customers to
 * cancel mid-checkout), new purchases are a plain one-time payment that
 * buys exactly 30 days of access — there is no recurring mandate to keep
 * renewing it, so this function can't just trust `status === 'active'`
 * forever the way it used to. Instead, both 'active' and 'cancelled' rows
 * are checked the same way: access holds for as long as
 * `current_period_end` is in the future, and lapses on its own the moment
 * it passes — no cron/sweep needed, consistent with the rest of this
 * project (see sweepExpiredOpportunities()'s comment in
 * lib/data/admin-opportunities.ts). A row with no `current_period_end` at
 * all (shouldn't normally happen once a payment is verified) falls back to
 * trusting `status === 'active'` alone, so nothing old breaks.
 *
 * This also still correctly covers every pre-existing Autopay row from
 * before this switch: the webhook keeps bumping `current_period_end`
 * forward on every successful renewal charge, and a cancelled-but-not-yet-
 * lapsed mandate (e.g. the customer revoked the UPI Autopay mandate from
 * their own banking app right after paying) keeps access exactly until the
 * period already paid for actually ends — same behavior as before, just
 * expressed as one rule instead of two.
 *
 * `halted` (a recurring charge that failed after retries) is NOT given
 * this grace period — by definition the customer didn't pay for whatever
 * cycle triggered the halt, so there's no fresh paid time to honor. Falls
 * through to `false` below along with every other non-active/cancelled
 * status.
 */
export function isSubscriptionAccessActive(
  subscription: Pick<UserSubscription, "status" | "current_period_end"> | null | undefined,
): boolean {
  if (!subscription) return false;
  if (subscription.status !== "active" && subscription.status !== "cancelled") return false;
  if (!subscription.current_period_end) return subscription.status === "active";
  return new Date(subscription.current_period_end).getTime() > Date.now();
}

/**
 * Access check for a recurring plan — mirrors hasFullAccess()'s
 * one-time-payment check, but on the subscriptions table, filtered to one
 * product at a time so the two plans never get conflated (a user could
 * hold an active row of each). Fetches every 'active'/'cancelled' row for
 * this user+product (there's normally at most one or two — e.g. an old
 * lapsed cancellation plus a fresh resubscribe) and grants access if any of
 * them currently qualifies per isSubscriptionAccessActive() above.
 */
export async function hasActiveSubscription(
  userId: string,
  product: SubscriptionProduct = "full_access",
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .eq("product", product)
    .in("status", ["active", "cancelled"]);

  if (error) {
    console.error("hasActiveSubscription failed:", error.message);
    return false;
  }
  return (data ?? []).some(isSubscriptionAccessActive);
}

/** Thin, explicitly-named wrapper for the Internal HR Openings product — used wherever gating on it reads more clearly than a bare hasActiveSubscription(userId, "internal_hr") call. */
export async function hasInternalAccess(userId: string): Promise<boolean> {
  return hasActiveSubscription(userId, "internal_hr");
}

/**
 * The ₹49→₹99 grandfathering check: true if this user has ever completed a
 * real full_access payment at the old ₹49 rate — in which case
 * getProductPricing("full_access", true) (lib/payments/razorpay.ts) should
 * be used for every future order of theirs, forever, regardless of gaps or
 * how long ago that payment was. Deliberately data-driven rather than
 * date-based: there's no separate "cutover date" or "founding member" flag
 * to keep in sync — a user either has a completed ₹49 row on record or they
 * don't, which is exactly what determines what they actually paid before.
 *
 * Filtered to `razorpay_payment_id is not null` so an abandoned checkout
 * (a 'created' row that stamped amount_paise but was never actually paid)
 * can't accidentally grandfather someone who never completed a payment.
 * Covers both the old real Autopay rows (sub_-prefixed, pre price-update)
 * and the current one-time Order rows uniformly, since both stamp the same
 * amount_paise/razorpay_payment_id columns on a successful payment.
 *
 * Per-payment, not per-cancellation: this project's manual (non-Autopay)
 * full_access purchases have nothing to "cancel" in the first place (see
 * app/api/subscriptions/cancel/route.ts) — access just lapses on its own
 * after 30 days — so there is no existing cancel-then-resubscribe rule to
 * honor here beyond "did they ever pay ₹49 for this product."
 */
export async function hasLegacyFullAccessPricing(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("product", "full_access")
    .eq("amount_paise", LEGACY_MONTHLY_PRICE_PAISE)
    .not("razorpay_payment_id", "is", null)
    .limit(1);

  if (error) {
    console.error("hasLegacyFullAccessPricing failed:", error.message);
    // Fail closed on the PRICE check specifically (charge the new ₹99 rate
    // rather than accidentally undercharging on a DB hiccup) — the
    // opposite of this file's usual fail-open convention for access
    // checks, since a wrong answer here has a direct revenue consequence
    // instead of just a wrongly-locked page.
    return false;
  }
  return (data ?? []).length > 0;
}

/**
 * The user's current (most recently updated) subscription row for one
 * product, for /dashboard's "Site access" panels — shows plan status,
 * renewal date, and a cancel action. Returns the latest row regardless of
 * status so a cancelled-but-not-yet-expired subscription still renders
 * correctly ("Cancels on ...") instead of silently disappearing.
 */
export async function getUserSubscription(
  userId: string,
  product: SubscriptionProduct = "full_access",
): Promise<UserSubscription | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("status, amount_paise, current_period_end, cancelled_at, razorpay_subscription_id")
    .eq("user_id", userId)
    .eq("product", product)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("getUserSubscription failed:", error.message);
    return null;
  }
  return data as UserSubscription | null;
}
