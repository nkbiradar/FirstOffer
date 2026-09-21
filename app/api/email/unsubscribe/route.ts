import { NextResponse, type NextRequest } from "next/server";
import { verifyUnsubscribeToken, setEmailOptOut } from "@/lib/data/email-preference";

// One-click unsubscribe link from the footer of every alert email — see
// lib/email/resend-client.ts. Deliberately no session check: it has to
// work from any device/email client the message is opened on, so the
// signed token in the link itself is the credential (see
// lib/data/email-preference.ts's sign/verifyUnsubscribeToken).
//
// GET is what a person actually clicking the footer link in the email
// body hits — it opts them out and sends them to a real confirmation
// page. POST is for the List-Unsubscribe header (see resend-client.ts):
// Gmail/Outlook/etc.'s own "Unsubscribe" button next to the sender name
// fires a silent background POST per RFC 8058 ("List-Unsubscribe=One-
// Click"), with no page shown to the user, so it must succeed with a
// plain 200 rather than redirecting anywhere.
async function handleUnsubscribe(uid: string, token: string): Promise<boolean> {
  if (!uid || !verifyUnsubscribeToken(uid, token)) return false;
  await setEmailOptOut(uid, true);
  return true;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid") ?? "";
  const token = searchParams.get("token") ?? "";

  const ok = await handleUnsubscribe(uid, token);
  return NextResponse.redirect(new URL(ok ? "/unsubscribed" : "/unsubscribed?error=1", request.url), 303);
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid") ?? "";
  const token = searchParams.get("token") ?? "";

  const ok = await handleUnsubscribe(uid, token);
  return NextResponse.json({ ok }, { status: ok ? 200 : 400 });
}
