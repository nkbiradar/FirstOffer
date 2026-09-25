import { NextResponse, type NextRequest } from "next/server";
import { sendOpportunityDigest } from "@/lib/email/opportunity-digest";

// Triggered by the Vercel Cron job in vercel.json (once a day). Vercel signs
// every cron request with this header — see
// https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs —
// so this rejects anything else, including a stray public GET, once
// CRON_SECRET is set. Until that env var is added in Vercel, this runs
// unauthenticated (logged below) rather than being permanently broken —
// safer to add the secret before relying on this in production.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else {
    console.warn("CRON_SECRET is not set — /api/cron/email-digest is running without auth.");
  }

  const result = await sendOpportunityDigest();
  return NextResponse.json({ ok: true, ...result });
}
