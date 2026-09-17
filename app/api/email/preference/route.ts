import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/supabase/auth";
import { setEmailOptOut } from "@/lib/data/email-preference";

// The dashboard's "Turn On"/"Turn Off" toggle for email alerts — a plain
// HTML form post (no client JS), same convention as every other admin/user
// preference form in this app. Session-based (unlike the one-click
// unsubscribe link, which is token-based) since this is only ever reached
// from within the signed-in dashboard.
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login?next=/dashboard", request.url), 303);
  }

  const formData = await request.formData();
  const intent = formData.get("intent");
  await setEmailOptOut(user.id, intent === "off");

  return NextResponse.redirect(new URL("/dashboard", request.url), 303);
}
