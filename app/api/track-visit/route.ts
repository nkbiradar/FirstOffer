import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { recordVisit } from "@/lib/data/site-visits";

const VISITOR_COOKIE = "fo_vid";
// ~2 years — long enough that a returning visitor is still recognized as
// "the same person" for the all-time unique-visitor count, without being a
// literal forever-cookie.
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 2;

// The only caller is components/VisitTracker.tsx, mounted in the root
// layout for every non-admin page load. Mints (or reads) a long-lived
// anonymous id in a cookie so the same browser isn't counted twice, then
// hands it to recordVisit() — see lib/data/site-visits.ts for how that
// turns into /admin's "Visitors Today"/"Total Visitors" tiles. No auth
// check here on purpose: this is meant to record EVERY visitor, signed in
// or not — VisitTracker is what skips the actual site admin.
export async function POST() {
  const cookieStore = await cookies();
  let visitorId = cookieStore.get(VISITOR_COOKIE)?.value;

  if (!visitorId) {
    visitorId = crypto.randomUUID();
    cookieStore.set(VISITOR_COOKIE, visitorId, {
      maxAge: VISITOR_COOKIE_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }

  await recordVisit(visitorId);
  return NextResponse.json({ ok: true });
}
