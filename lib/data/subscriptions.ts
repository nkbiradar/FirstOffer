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
import type { SubscriptionProduct } from "@/lib/payments/razorpay";

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
 * `status = 'active'` always grants access (the normal case, including a
 * user-initiated cancel via /dashboard: that flow — see
 * app/api/subscriptions/cancel/route.ts — deliberately leaves `status`
 * alone and only sets `cancelled_at`, so Razorpay's own end-of-cycle
 * webhook is what later flips `status` away from 'active').
 *
 * `status = 'cancelled'` ALSO grants access for as long as
 * `current_period_end` is still in the future. This matters because
 * Razorpay can send `subscription.cancelled` immediately — e.g. the
 * customer revokes the UPI Autopay mandate from their own banking app, or
 * the mandate registration itself fails right after the first charge —
 * well before the period they already paid for has actually ended. Without
 * this, a customer who paid and then had their mandate cancelled minutes
 * later would be locked out despite having paid for a full cycle (this
 * fixed exactly that incident). Once current_period_end passes, this
 * returns false on its own — no cron/sweep needed, consistent with the
 * rest of this project (see sweepExpiredOpportunities()'s comment in
 * lib/data/admin-opportunities.ts).
 *
 * `halted` (renewal charge failed after retries) is NOT given this grace
 * period — by definition the customer didn't pay for whatever cycle
 * triggered the halt, so there's no fresh paid time to honor.
 */
export function isSubscriptionAccessActive(
  subscription: Pick<UserSubscription, "status" | "current_period_end"> | null | undefined,
): boolean {
  if (!subscription) return false;
  if (subscription.status === "active") return true;
  if (subscription.status === "cancelled" && subscription.current_period_end) {
    return new Date(subscription.current_period_end).getTime() > Date.now();
  }
  return false;
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
