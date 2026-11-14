// Bulk "who currently has access" lookup with the service-role client, for
// background jobs (cron, admin email) that run without a signed-in user's
// cookies. hasFullAccess()/hasInternalAccess() use the cookie-based client,
// so under RLS they always answer "no" outside a user's own request — never
// use them from a cron. Same rules as isSubscriptionAccessActive().
import { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;
const PAGE = 1000;

export async function getPaidUserIds(admin: Admin): Promise<{ fullAccess: Set<string>; internal: Set<string> }> {
  const fullAccess = new Set<string>();
  const internal = new Set<string>();
  const now = Date.now();

  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin
      .from("subscriptions")
      .select("user_id, product, status, current_period_end")
      .in("status", ["active", "cancelled"])
      .range(from, from + PAGE - 1);
    if (error) {
      console.error("getPaidUserIds (subscriptions) failed:", error.message);
      break;
    }
    for (const r of data ?? []) {
      const ok = r.current_period_end ? new Date(r.current_period_end).getTime() > now : r.status === "active";
      if (!ok) continue;
      // Career Kit (one-time downloads) grants neither membership.
      if (r.product === "career_kit") continue;
      (r.product === "internal_hr" ? internal : fullAccess).add(r.user_id as string);
    }
    if ((data ?? []).length < PAGE) break;
  }

  // Legacy one-time lifetime unlocks also count as full access.
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin
      .from("opportunity_unlocks")
      .select("user_id")
      .eq("status", "paid")
      .range(from, from + PAGE - 1);
    if (error) {
      console.error("getPaidUserIds (unlocks) failed:", error.message);
      break;
    }
    for (const r of data ?? []) fullAccess.add(r.user_id as string);
    if ((data ?? []).length < PAGE) break;
  }

  return { fullAccess, internal };
}
