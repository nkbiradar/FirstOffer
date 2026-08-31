// Reads for the "platform access" payment feature (one-time fee, unlocks
// everything). Same pattern as lib/data/opportunity-unlocks.ts: the normal
// (cookie/RLS-scoped) client, not the service-role admin client, and fails
// soft so a page never crashes if the user_access table/migration hasn't been
// applied yet. See supabase/schema.sql for the table and its RLS policy.
import { createClient } from "@/lib/supabase/server";

export async function hasPlatformAccess(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_access")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "paid")
    .maybeSingle();

  if (error) {
    console.error("hasPlatformAccess failed:", error.message);
    return false;
  }
  return Boolean(data);
}

export async function getUserAccess(userId: string): Promise<{ paid_at: string | null; amount_paise: number } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_access")
    .select("paid_at, amount_paise")
    .eq("user_id", userId)
    .eq("status", "paid")
    .maybeSingle();

  if (error) {
    console.error("getUserAccess failed:", error.message);
    return null;
  }
  return data;
}