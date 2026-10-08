import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyGoogleJobs } from "@/lib/seo/google-indexing";

// Daily (vercel.json). Every listing auto-expires 48h after publishing, or
// earlier on its deadline. The detail page then turns noindex and drops its
// JobPosting schema — this tells Google to recrawl those pages right away so
// expired jobs leave Google Jobs quickly instead of lingering for days
// (which Google treats as a quality problem for job sites).
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  // 26h window (not 24h) so a slightly late cron run never skips a job.
  const since = new Date(now.getTime() - 26 * 60 * 60 * 1000);
  const todayKey = now.toISOString().slice(0, 10);
  const sinceKey = since.toISOString().slice(0, 10);

  const admin = createAdminClient();
  const [byExpiry, byDeadline] = await Promise.all([
    admin
      .from("opportunities")
      .select("id")
      .eq("is_internal", false)
      .gt("expires_at", since.toISOString())
      .lte("expires_at", now.toISOString()),
    admin
      .from("opportunities")
      .select("id")
      .eq("is_internal", false)
      .gte("deadline", sinceKey)
      .lt("deadline", todayKey),
  ]);

  if (byExpiry.error || byDeadline.error) {
    console.error("google-indexing cron query failed:", byExpiry.error?.message ?? byDeadline.error?.message);
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }

  const ids = [...new Set([...(byExpiry.data ?? []), ...(byDeadline.data ?? [])].map((r) => r.id as string))];
  const notified = await notifyGoogleJobs(ids, "URL_UPDATED");
  return NextResponse.json({ ok: true, expired: ids.length, notified });
}
