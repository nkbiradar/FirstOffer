// "Trusted by 2100+ students" — the number of signed-up accounts, rounded
// DOWN to the nearest 50 (2149 → "2100+", 2150 → "2150+", 2200 → "2200+"),
// so it updates by itself as sign-ups grow. Never shows less than
// STUDENT_COUNT_FLOOR (the founder's figure), which is also what's shown
// if the count can't be loaded. Plain module (no server imports) so client
// components can use formatStudentCount too.
export const STUDENT_COUNT_FLOOR = 2100;
const STEP = 50;

export const STUDENT_COUNT_FALLBACK_LABEL = `${STUDENT_COUNT_FLOOR}+`;

export function formatStudentCount(totalSignups: number | null | undefined): string {
  const rounded = Math.floor(Math.max(0, Number(totalSignups) || 0) / STEP) * STEP;
  return `${Math.max(STUDENT_COUNT_FLOOR, rounded)}+`;
}
