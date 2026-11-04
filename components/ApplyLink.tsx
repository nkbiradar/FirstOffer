"use client";

import { useEffect, useState } from "react";
import { APPLIED_EVENT, emitApplied, emitStreak } from "@/lib/streak-events";

// The real apply button on an opportunity (HR email / Google Form / apply
// link). For a signed-in student, opening it also counts the role as
// applied — so their daily streak builds without having to remember "Mark
// as Applied" — with an Undo right there. The link itself always opens
// normally; tracking never blocks it.
export default function ApplyLink({
  action,
  className = "",
  opportunityId,
  isSignedIn,
  initialApplied,
}: {
  action: { label: string; href: string };
  className?: string;
  opportunityId: string;
  isSignedIn: boolean;
  initialApplied: boolean;
}) {
  const [applied, setApplied] = useState(initialApplied);
  const [counted, setCounted] = useState(false);

  useEffect(() => {
    const onApplied = (e: Event) => {
      const d = (e as CustomEvent<{ opportunityId: string; applied: boolean }>).detail;
      if (d?.opportunityId !== opportunityId) return;
      setApplied(d.applied);
      if (!d.applied) setCounted(false);
    };
    window.addEventListener(APPLIED_EVENT, onApplied);
    return () => window.removeEventListener(APPLIED_EVENT, onApplied);
  }, [opportunityId]);

  function onOpen() {
    if (!isSignedIn || applied) return;
    setApplied(true);
    setCounted(true);
    emitApplied(opportunityId, true);
    fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opportunityId }),
      keepalive: true,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => emitStreak(j?.streak))
      .catch(() => {
        /* best effort — the student can still use "Mark as Applied" */
      });
  }

  async function undo() {
    setCounted(false);
    setApplied(false);
    emitApplied(opportunityId, false);
    try {
      const r = await fetch(`/api/applications/${opportunityId}`, { method: "DELETE" });
      const j = r.ok ? await r.json() : null;
      emitStreak(j?.streak);
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <a
        className={`btn btn-primary apply-now no-copy ${className}`}
        draggable={false}
        href={action.href}
        onAuxClick={onOpen}
        onClick={onOpen}
        rel="noopener noreferrer"
        target={action.href.startsWith("mailto:") ? undefined : "_blank"}
      >
        {action.label}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M7 17L17 7M17 7H8M17 7v9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
      {counted && (
        <div className="apply-counted" role="status">
          <span className="apply-counted-ok">✓ Counted as applied</span>
          <span className="apply-counted-text">Added to your streak 🔥</span>
          <button className="apply-counted-undo" onClick={undo} type="button">
            Undo
          </button>
        </div>
      )}
    </>
  );
}
