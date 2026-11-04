import { NextResponse, type NextRequest } from "next/server";
import { sendCheckoutRecoveryEmails } from "@/lib/email/checkout-recovery";

// Abandoned-checkout reminder emails (lib/email/checkout-recovery.ts).
// Called every 10 minutes by a Supabase pg_cron job (see supabase/schema.sql)
// with "Authorization: Bearer <CRON_SECRET>". Unlike the daily digest this one
// refuses to run without CRON_SECRET, since it emails real people.
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await sendCheckoutRecoveryEmails();
  return NextResponse.json({ ok: true, ...result });
}
