import { NextResponse, type NextRequest } from "next/server";
import { sendCheckoutRecoveryEmails } from "@/lib/email/checkout-recovery";
import { processEmailQueue } from "@/lib/email/broadcast";

// Abandoned-checkout reminder emails (lib/email/checkout-recovery.ts).
// Called every 10 minutes by a Supabase pg_cron job (see supabase/schema.sql)
// with "Authorization: Bearer <CRON_SECRET>". Unlike the daily digest this one
// refuses to run without CRON_SECRET, since it emails real people.
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Optional one-off catch-up for older checkouts: ?hours=336 (max 14 days).
  const hours = Number(request.nextUrl.searchParams.get("hours"));
  const result = await sendCheckoutRecoveryEmails(Number.isFinite(hours) && hours > 0 ? hours : undefined);
  // Same 10-minute tick also sends the next batch of admin broadcast emails.
  const queue = await processEmailQueue();
  return NextResponse.json({ ok: true, ...result, queue });
}
