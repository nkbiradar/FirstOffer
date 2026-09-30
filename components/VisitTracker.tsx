"use client";

import { useEffect, useRef } from "react";

// Fires one fire-and-forget ping to /api/site-visit per full page
// load — mounted once in the root layout (app/layout.tsx), so a
// client-side route change (Link navigation) does NOT re-fire this, only
// a fresh page load does. That's the right unit for "a visit." Skipped
// entirely when `isAdmin` is true (the layout already knows this from the
// signed-in session) so the site's own admin browsing/testing never
// inflates the "how many strangers visited" number on /admin. Renders
// nothing — this component is purely a side effect.
//
// Deliberately named "site-visit", not "track-visit" — a path containing
// "track" (or "analytics"/"pixel"/"beacon"/"collect") is exactly the kind
// of substring EasyPrivacy/EasyList (the filter lists behind uBlock
// Origin, most browsers' built-in tracking protection, and Brave Shields)
// pattern-match on, so a meaningful slice of visitors — especially a
// developer-heavy audience, who are disproportionately likely to run an
// ad/tracker blocker — would have this POST silently blocked before it
// ever left the browser. That shows up as "Total Visitors" barely moving
// even when real traffic (e.g. from a Reddit post) is coming in. This
// endpoint only ever counts anonymous visits for our own /admin
// dashboard — it's not third-party tracking — but the blocklists match on
// the URL text, not on intent.
export default function VisitTracker({ isAdmin }: { isAdmin: boolean }) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (isAdmin || firedRef.current) return;
    firedRef.current = true;
    fetch("/api/site-visit", { method: "POST" }).catch(() => {
      // Best-effort — a failed ping just means this one visit doesn't get
      // counted, never worth surfacing to the visitor.
    });
  }, [isAdmin]);

  return null;
}
