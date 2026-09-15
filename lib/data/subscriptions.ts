// Reads for the recurring ₹49/month subscription feature — the current
// way NEW customers get full site access (see supabase/schema.sql's
// `subscriptions` table). Existing lifetime buyers from the old one-time
// unlock are untouched and keep working through
// lib/data/opportunity-unlocks.ts's `opportunity_unlocks` check; this file
// only ever looks at the new table. Same convention as
// opportunity-unlocks.ts: the normal RLS-scoped client, fails soft so a
// page never crashes if the migration hasn't been applied yet.
import { createClient } from "@/lib/supabase/server";

export type UserSubscription = {
  status: "created" | "authenticated" | "active" | "pending" | "halted" | "cancelled" | "completed" | "expired";
  amount_paise: number;
  current_period_end: string | null;
  cancelled_at: string | null;
  razorpay_subscription_id: string;
};

/**
 * Access check for the recurring plan — mirrors hasFullAccess()'s
 * one-time-payment check, but on the subscriptions table. Deliberately
 * gated on Razorpay's own `status = 'active'` alone, not a hand-rolled
 * `current_period_end` comparison — see the design-rationale comment on
 * the `subscriptions` table in supabase/schema.sql for why.
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("hasActiveSubscription failed:", error.message);
    return false;
  }
  return Boolean(data);
}

/**
 * The user's current (most recently updated) subscription row, for
 * /dashboard's "Site access" panel — shows plan status, renewal date, and
 * a cancel action. Returns the latest row regardless of status so a
 * cancelled-but-not-yet-expired subscription still renders correctly
 * ("Cancels on ...") instead of silently disappearing.
 */
export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("status, amount_paise, current_period_end, cancelled_at, razorpay_subscription_id")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("getUserSubscription failed:", error.message);
    return null;
  }
  return data as UserSubscription | null;
}
