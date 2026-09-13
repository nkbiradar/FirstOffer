import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type SubscriptionBody = {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
};

// Stores a browser's Push subscription so it can receive "new opportunities
// added" alerts (see components/PushNotificationPrompt.tsx). No sign-in
// required — matches the rest of the site's "browsing never requires an
// account" stance. Upserts on endpoint so re-subscribing (e.g. after
// clearing site data) doesn't create a duplicate row.
export async function POST(request: NextRequest) {
  let body: SubscriptionBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const endpoint = body.endpoint;
  const p256dh = body.keys?.p256dh;
  const auth = body.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("push_subscriptions")
    .upsert(
      { endpoint, p256dh, auth, user_agent: request.headers.get("user-agent") ?? null },
      { onConflict: "endpoint" },
    );

  if (error) {
    console.error("Could not save push subscription:", error.message);
    return NextResponse.json({ error: "Could not save subscription." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
