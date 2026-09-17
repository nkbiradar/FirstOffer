import { NextResponse, type NextRequest } from "next/server";
import { verifyUnsubscribeToken, setEmailOptOut } from "@/lib/data/email-preference";

// One-click unsubscribe link from the footer of every alert email — see
// lib/email/resend-client.ts. Deliberately no session check: it has to
// work from any device/email client the message is opened on, so the
// signed token in the link itself is the credential (see
// lib/data/email-preference.ts's sign/verifyUnsubscribeToken).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid") ?? "";
  const token = searchParams.get("token") ?? "";

  if (!uid || !verifyUnsubscribeToken(uid, token)) {
    return NextResponse.redirect(new URL("/unsubscribed?error=1", request.url), 303);
  }

  await setEmailOptOut(uid, true);
  return NextResponse.redirect(new URL("/unsubscribed", request.url), 303);
}
