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
 * Access check for a recurring plan — mirrors hasFullAccess()'s
 * one-time-payment check, but on the subscriptions table, filtered to one
 * product at a time so the two plans never get conflated (a user could
 * hold an active row of each). Deliberately gated on Razorpay's own
 * `status = 'active'` alone, not a hand-rolled `current_period_end`
 * comparison — see the design-rationale comment on the `subscriptions`
 * table in supabase/schema.sql for why.
 */
export async function hasActiveSubscription(
  userId: string,
  product: SubscriptionProduct = "full_access",
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("product", product)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("hasActiveSubscription failed:", error.message);
    return false;
  }
  return Boolean(data);
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
