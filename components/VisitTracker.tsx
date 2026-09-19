"use client";

import { useEffect, useRef } from "react";

// Fires one fire-and-forget ping to /api/track-visit per full page
// load — mounted once in the root layout (app/layout.tsx), so a
// client-side route change (Link navigation) does NOT re-fire this, only
// a fresh page load does. That's the right unit for "a visit." Skipped
// entirely when `isAdmin` is true (the layout already knows this from the
// signed-in session) so the site's own admin browsing/testing never
// inflates the "how many strangers visited" number on /admin. Renders
// nothing — this component is purely a side effect.
export default function VisitTracker({ isAdmin }: { isAdmin: boolean }) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (isAdmin || firedRef.current) return;
    firedRef.current = true;
    fetch("/api/track-visit", { method: "POST" }).catch(() => {
      // Best-effort — a failed ping just means this one visit doesn't get
      // counted, never worth surfacing to the visitor.
    });
  }, [isAdmin]);

  return null;
}
