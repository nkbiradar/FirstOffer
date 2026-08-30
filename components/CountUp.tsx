"use client";

import { useEffect, useRef, useState } from "react";

// Animates a number counting up from 0 once it scrolls into view — used for
// the hero/admin stat tiles. Purely presentational: the real value still
// comes from the server (getSiteStats()/getAdminDashboardStats()), this
// just animates how it's revealed. Falls back to showing the final value
// immediately if IntersectionObserver isn't available.
export default function CountUp({ value, durationMs = 900 }: { value: number; durationMs?: number }) {
  // Always start at `value`, matching what the server rendered — the old
  // `typeof IntersectionObserver === "undefined" ? value : 0` check reads
  // as "0" on the client (the browser has IntersectionObserver) but reads
  // as `value` during SSR (Node has no such global), so React always saw
  // a text mismatch on hydration and threw the whole tree away to
  // re-render client-side. Starting both renders at `value` keeps SSR and
  // the first client render identical; the count-up animation still kicks
  // in from 0 the moment the tile scrolls into view (see setDisplay(0)
  // below), and anyone without JS just sees the real number immediately
  // instead of being stuck at 0 forever.
  const [display, setDisplay] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || started.current || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        observer.disconnect();

        setDisplay(0);
        const start = performance.now();
        function tick(now: number) {
          const progress = Math.min(1, (now - start) / durationMs);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(Math.round(eased * value));
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, durationMs]);

  return <span ref={ref}>{display}</span>;
}
