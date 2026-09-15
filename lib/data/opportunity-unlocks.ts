// Reads for the "unlock HR contact info" payment feature (Phase 6). Same
// pattern as lib/data/user-applications.ts: the normal (cookie/RLS-scoped)
// client, not the service-role admin client, and fails soft so a page
// never crashes if the opportunity_unlocks table/migration hasn't been
// applied yet. See supabase/schema.sql for the table and its RLS policy.
import { createClient } from "@/lib/supabase/server";
import type { OpportunityWithCompany } from "@/lib/data/opportunities";
import { hasActiveSubscription } from "@/lib/data/subscriptions";

export async function hasUnlockedContact(userId: string, opportunityId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opportunity_unlocks")
    .select("id")
    .eq("user_id", userId)
    .eq("opportunity_id", opportunityId)
    .eq("status", "paid")
    .maybeSingle();

  if (error) {
    console.error("hasUnlockedContact failed:", error.message);
    return false;
  }
  return Boolean(data);
}

/**
 * Site-wide access check. Two independent ways in, checked in parallel:
 *
 * 1. Legacy one-time ₹49 payment — a `paid` row in `opportunity_unlocks`.
 *    New purchases no longer create these, but anyone who already has one
 *    keeps lifetime access untouched, forever — this is the grandfathering
 *    guarantee for existing customers when the pricing model changed to
 *    recurring billing. opportunity_id is intentionally ignored: ANY paid
 *    row for this user grants access to everything.
 * 2. Current ₹49/month subscription — an `active` row in `subscriptions`
 *    (see lib/data/subscriptions.ts). This is what new purchases create.
 *
 * A user only ever needs one of these to be true.
 */
export async function hasFullAccess(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const [{ data, error }, subscribed] = await Promise.all([
    supabase.from("opportunity_unlocks").select("id").eq("user_id", userId).eq("status", "paid").limit(1).maybeSingle(),
    hasActiveSubscription(userId),
  ]);

  if (error) {
    console.error("hasFullAccess failed:", error.message);
    return subscribed;
  }
  return Boolean(data) || subscribed;
}

export type UserUnlock = {
  amount_paise: number;
  paid_at: string | null;
  opportunity: OpportunityWithCompany;
};

type UnlockRow = {
  amount_paise: number;
  paid_at: string | null;
  opportunity: OpportunityWithCompany | null;
};

/**
 * A user's successfully-paid unlocks, newest-first — for /dashboard's
 * "Unlocked opportunities" panel (what they've actually paid to reveal).
 * Only `status = 'paid'` rows count; a `created`/`failed` order the user
 * abandoned mid-checkout shouldn't show up as something they own.
 */
export async function getUserUnlocks(userId: string): Promise<UserUnlock[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opportunity_unlocks")
    .select("amount_paise, paid_at, opportunity:opportunities(*, company:companies(id, name, slug, logo_url))")
    .eq("user_id", userId)
    .eq("status", "paid")
    .order("paid_at", { ascending: false });

  if (error) {
    console.error("getUserUnlocks failed:", error.message);
    return [];
  }

  return ((data ?? []) as unknown as UnlockRow[]).filter(
    (row): row is UnlockRow & { opportunity: OpportunityWithCompany } => row.opportunity !== null,
  );
}
