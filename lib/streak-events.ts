// Browser events that keep the streak UI in sync without a page reload:
// the apply link / "Mark as Applied" button fire them, the navbar chip and
// the milestone celebration listen.
export type StreakState = { current: number; best: number; appliedToday: boolean };

export const STREAK_EVENT = "fo-streak";
export const APPLIED_EVENT = "fo-applied";

export function emitStreak(state: StreakState | undefined | null) {
  if (!state || typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<StreakState>(STREAK_EVENT, { detail: state }));
}

export function emitApplied(opportunityId: string, applied: boolean) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(APPLIED_EVENT, { detail: { opportunityId, applied } }));
}
