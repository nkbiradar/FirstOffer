"use client";

import { useEffect } from "react";

// Makes unlocked apply details (HR email, contact, form/apply links) harder
// to copy and share: blocks copy, cut, right-click / long-press menus and
// dragging inside any `.no-copy` element. The Apply / Email buttons still
// work normally. Note: no website can truly block screenshots — this only
// stops easy copy-paste. See Terms → "Personal use only".
export default function NoCopyGuard() {
  useEffect(() => {
    const inside = (e: Event) => e.target instanceof Element && Boolean(e.target.closest(".no-copy"));
    const selectionInside = () => {
      const sel = window.getSelection();
      const node = sel?.anchorNode;
      const el = node instanceof Element ? node : node?.parentElement;
      return Boolean(el?.closest(".no-copy"));
    };
    const block = (e: Event) => {
      if (inside(e) || ((e.type === "copy" || e.type === "cut") && selectionInside())) e.preventDefault();
    };
    // Best effort on desktop: wipe the clipboard after the PrintScreen key.
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") navigator.clipboard?.writeText("").catch(() => {});
    };
    const events = ["copy", "cut", "contextmenu", "dragstart", "selectstart"] as const;
    events.forEach((t) => document.addEventListener(t, block));
    document.addEventListener("keyup", onKeyUp);
    return () => {
      events.forEach((t) => document.removeEventListener(t, block));
      document.removeEventListener("keyup", onKeyUp);
    };
  }, []);
  return null;
}
