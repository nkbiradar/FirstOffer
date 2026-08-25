// Reads for the "unlock HR contact info" payment feature (Phase 6). Same
// pattern as lib/data/user-applications.ts: the normal (cookie/RLS-scoped)
// client, not the service-role admin client, and fails soft so a page
// never crashes if the opportunity_unlocks table/migration hasn't been
// applied yet. See supabase/schema.sql for the table and its RLS policy.
import { createClient } from "@/lib/supabase/server";

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
