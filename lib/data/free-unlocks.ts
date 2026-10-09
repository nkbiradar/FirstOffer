import { createAdminClient } from "@/lib/supabase/admin";

// One free unlock per account — see supabase/schema.sql (free_unlocks).
export type FreeUnlockStatus = {
  /** True once the account has spent its free unlock (on any job). */
  used: boolean;
  /** The job it was spent on, if used. */
  opportunityId: string | null;
};

export async function getFreeUnlockStatus(userId: string): Promise<FreeUnlockStatus> {
  const { data, error } = await createAdminClient()
    .from("free_unlocks")
    .select("opportunity_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error("getFreeUnlockStatus failed:", error.message);
    // Fail closed: if we can't tell, don't offer another free unlock.
    return { used: true, opportunityId: null };
  }
  return { used: Boolean(data), opportunityId: (data?.opportunity_id as string | undefined) ?? null };
}
