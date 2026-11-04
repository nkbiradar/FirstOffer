// Daily apply streak + weekly goal, worked out from user_applications
// (each "applied" row already carries applied_at). Days are counted in
// India time, so applying at 11:50 pm still counts for that day. A streak
// stays alive through today until midnight even if today has no apply yet.
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

const IST_OFFSET_MS = 5.5 * 3_600_000;
const DAY_MS = 86_400_000;
export const DEFAULT_WEEKLY_GOAL = 15;
export const GOAL_OPTIONS = [5, 10, 15, 20, 30, 50] as const;
/** Streak lengths that get a one-time celebration. */
export const STREAK_MILESTONES = [3, 7, 14, 30] as const;
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Whole days since 1 Jan 1970, India time. */
export function istDay(ms: number): number {
  return Math.floor((ms + IST_OFFSET_MS) / DAY_MS);
}
/** 0 = Monday … 6 = Sunday (1 Jan 1970 was a Thursday). */
function weekdayIndex(day: number): number {
  return (day + 3) % 7;
}

export type StreakSummary = {
  current: number;
  best: number;
  appliedToday: boolean;
  weekCount: number;
  weekGoal: number;
  /** Last 7 days, oldest first, ending today. */
  last7: { label: string; applied: boolean; today: boolean }[];
};

export function normalizeGoal(value: unknown): number {
  const n = Number(value);
  return (GOAL_OPTIONS as readonly number[]).includes(n) ? n : DEFAULT_WEEKLY_GOAL;
}

export function computeStreak(appliedAt: string[], weekGoal = DEFAULT_WEEKLY_GOAL, now = Date.now()): StreakSummary {
  const today = istDay(now);
  const days = new Set<number>();
  const weekStart = today - weekdayIndex(today);
  let weekCount = 0;
  for (const iso of appliedAt) {
    const d = istDay(Date.parse(iso));
    if (!Number.isFinite(d)) continue;
    days.add(d);
    if (d >= weekStart && d <= today) weekCount += 1;
  }

  let current = 0;
  const anchor = days.has(today) ? today : days.has(today - 1) ? today - 1 : null;
  if (anchor !== null) for (let d = anchor; days.has(d); d -= 1) current += 1;

  let best = 0;
  let run = 0;
  let prev: number | null = null;
  for (const d of [...days].sort((a, b) => a - b)) {
    run = prev !== null && d === prev + 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = today - 6 + i;
    return { label: d === today ? "Today" : WEEKDAYS[weekdayIndex(d)], applied: days.has(d), today: d === today };
  });

  return { current, best: Math.max(best, current), appliedToday: days.has(today), weekCount, weekGoal, last7 };
}

/** The signed-in user's own streak (RLS-scoped client). Never throws. */
export const getStreakSummary = cache(async (userId: string, weekGoal?: unknown): Promise<StreakSummary> => {
  try {
    const supabase = await createClient();
    const since = new Date(Date.now() - 400 * DAY_MS).toISOString();
    const { data, error } = await supabase
      .from("user_applications")
      .select("applied_at")
      .eq("user_id", userId)
      .gte("applied_at", since)
      .order("applied_at", { ascending: false })
      .limit(3000);
    if (error) throw new Error(error.message);
    return computeStreak((data ?? []).map((r) => r.applied_at as string), normalizeGoal(weekGoal));
  } catch (err) {
    console.error("getStreakSummary failed:", err instanceof Error ? err.message : err);
    return computeStreak([], normalizeGoal(weekGoal));
  }
});
