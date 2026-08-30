import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Fixed-window rate limiter backed by the `rate_limit_hits` table +
 * `check_rate_limit()` Postgres function (see supabase/schema.sql).
 *
 * Vercel serverless functions don't share memory between invocations, so
 * a plain in-process counter would reset (or diverge across instances) on
 * every request — this has to live in the database to actually work in
 * production.
 *
 * Fails OPEN on unexpected errors (e.g. the RPC/table not existing yet
 * because the schema migration hasn't been applied) rather than blocking
 * real users if rate limiting itself breaks — logs so it's visible, but
 * doesn't turn an infra hiccup into a payment-blocking outage.
 */
export async function checkRateLimit(
  key: string,
  { windowSeconds, maxHits }: { windowSeconds: number; maxHits: number },
): Promise<{ allowed: boolean; hitCount: number }> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .rpc("check_rate_limit", {
        p_key: key,
        p_window_seconds: windowSeconds,
        p_max_hits: maxHits,
      })
      .single<{ allowed: boolean; hit_count: number }>();

    if (error || !data) {
      console.error("Rate limit check failed, allowing request:", error?.message);
      return { allowed: true, hitCount: 0 };
    }

    return { allowed: data.allowed, hitCount: data.hit_count };
  } catch (err) {
    console.error("Rate limit check threw, allowing request:", err);
    return { allowed: true, hitCount: 0 };
  }
}
