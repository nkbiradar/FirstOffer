// Reads for the "unlock HR contact info" payment feature (Phase 6). Same
// pattern as lib/data/user-applications.ts: the normal (cookie/RLS-scoped)
// client, not the service-role admin client, and fails soft so a page
// never crashes if the opportunity_unlocks table/migration hasn't been
// applied yet. See supabase/schema.sql for the table and its RLS policy.
import { createClient } from "@/lib/supabase/server";
import type { OpportunityWithCompany } from "@/lib/data/opportunities";

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
