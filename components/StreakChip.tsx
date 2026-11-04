"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { STREAK_EVENT, type StreakState } from "@/lib/streak-events";

// "🔥 4" in the navbar for signed-in students with an active apply streak.
// Updates live when they apply (see lib/streak-events.ts).
export default function StreakChip({ initial }: { initial: number }) {
  const [current, setCurrent] = useState(initial);
  useEffect(() => {
    const on = (e: Event) => setCurrent((e as CustomEvent<StreakState>).detail.current);
    window.addEventListener(STREAK_EVENT, on);
    return () => window.removeEventListener(STREAK_EVENT, on);
  }, []);
  if (current < 1) return null;
  return (
    <Link
      aria-label={`${current}-day apply streak — open your dashboard`}
      className="streak-chip"
      href="/dashboard"
      title={`${current}-day apply streak`}
    >
      <span aria-hidden="true">🔥</span> {current}
    </Link>
  );
}
