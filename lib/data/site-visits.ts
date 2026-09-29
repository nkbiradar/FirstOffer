// Backs the admin-only "how many strangers visited the site" number on
// /admin (Visitors Today / Total Visitors). Deliberately NOT a full
// analytics system — no page-level breakdown, no referrers, no bot
// filtering beyond "had to run the browser's JS to get here" (see
// components/VisitTracker.tsx, the only thing that calls recordVisit()).
// Always uses the service-role client — same convention as the rest of
// this file's siblings (admin-opportunities.ts, etc.) — since RLS on
// site_visits has no policies at all (see supabase/schema.sql).
import { createAdminClient } from "@/lib/supabase/admin";

/** yyyy-mm-dd in IST — matches istDateKey() in admin-opportunities.ts, so "today" means the same thing across every admin stat. */
function istDateKey(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

/**
 * Records one visit from `visitorId` (the long-lived cookie value minted by
 * app/api/track-visit/route.ts) for today. Upserted with `ignoreDuplicates`
 * on the (visitor_id, day) primary key, so a visitor loading ten pages in
 * one day still only ever produces one row — this is what makes "Visitors
 * Today" and "Total Visitors" both mean unique people, not raw page loads.
 * Fails soft: a logging hiccup should never break the page that triggered it.
 */
export async function recordVisit(visitorId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("site_visits")
    .upsert({ visitor_id: visitorId, day: istDateKey() }, { onConflict: "visitor_id,day", ignoreDuplicates: true });

  if (error) {
    console.error("recordVisit failed:", error.message);
  }
}

export type SiteVisitStats = {
  today: number;
  allTime: number;
};

/**
 * Today = count of rows for today's date key (one per unique visitor,
 * thanks to the upsert above). All-time = count of DISTINCT visitor_id
 * across every row ever — a visitor who's come back on five different days
 * still only counts once.
 *
 * There's no `count(distinct ...)` in the supabase-js query builder, and a
 * single unbounded `.select("visitor_id")` silently caps at PostgREST's
 * default 1000-row limit — the exact same class of bug fixed in
 * getAdminDashboardStats() (see that file's history). site_visits has one
 * row per (visitor_id, day), not per distinct visitor, so that cap is hit
 * quickly once the site's been live for a while — this paginates through
 * every row in fixed-size pages and de-dupes in memory instead of relying
 * on a single fetch, so "Total Visitors" keeps growing correctly no matter
 * how many rows the table has.
 */
export async function getSiteVisitStats(): Promise<SiteVisitStats> {
  const admin = createAdminClient();

  const todayResult = await admin
    .from("site_visits")
    .select("visitor_id", { count: "exact", head: true })
    .eq("day", istDateKey());

  if (todayResult.error) {
    console.error("getSiteVisitStats (today) failed:", todayResult.error.message);
  }

  const allTimeIds = new Set<string>();
  const PAGE_SIZE = 1000;
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await admin
      .from("site_visits")
      .select("visitor_id")
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error("getSiteVisitStats (all-time) failed:", error.message);
      break;
    }
    for (const row of data ?? []) {
      allTimeIds.add(row.visitor_id);
    }
    if (!data || data.length < PAGE_SIZE) break;
  }

  return {
    today: todayResult.count ?? 0,
    allTime: allTimeIds.size,
  };
}
