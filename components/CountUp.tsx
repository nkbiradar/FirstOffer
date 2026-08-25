"use client";

import { useEffect, useRef, useState } from "react";

// Animates a number counting up from 0 once it scrolls into view — used for
// the hero/admin stat tiles. Purely presentational: the real value still
// comes from the server (getSiteStats()/getAdminDashboardStats()), this
// just animates how it's revealed. Falls back to showing the final value
// immediately if IntersectionObserver isn't available.
export default function CountUp({ value, durationMs = 900 }: { value: number; durationMs?: number }) {
  const [display, setDisplay] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      setDisplay(value);
      return;
    }

    // Reset to 0 to prepare for the count-up animation on client
    setDisplay(0);
    started.current = false;

    const el = ref.current;
    if (!el) return;

    let rafId: number;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        observer.disconnect();

        const start = performance.now();
        function tick(now: number) {
          const progress = Math.min(1, (now - start) / durationMs);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(Math.round(eased * value));
          if (progress < 1) {
            rafId = requestAnimationFrame(tick);
          }
        }
        rafId = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [value, durationMs]);

  return <span ref={ref}>{display}</span>;
}
