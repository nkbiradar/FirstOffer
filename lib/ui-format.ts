// Small, presentation-only helpers shared by cards/pages. Nothing here
// touches data fetching, validation, or business logic — purely formatting.

const AVATAR_PALETTE: [string, string][] = [
  ["#4f46e5", "#0d9488"],
  ["#db2777", "#f97316"],
  ["#0ea5e9", "#6366f1"],
  ["#059669", "#0ea5e9"],
  ["#d97706", "#dc2626"],
  ["#7c3aed", "#db2777"],
  ["#0891b2", "#4f46e5"],
];

/** Deterministic gradient pair for a company avatar, derived from its name. */
export function avatarGradient(name: string): { a: string; b: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 997;
  }
  const [a, b] = AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
  return { a, b };
}

/** First one or two letters for a text avatar fallback. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/** "Today" / "Yesterday" / "3d ago" / falls back to a short date further out. */
export function formatRelativeTime(iso: string | null): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const diffMs = Date.now() - then;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/**
 * Urgency read on a job's own application `deadline` (a plain yyyy-mm-dd
 * date, IST) — "Closes today" / "Closes tomorrow" / "Closes in Xd". Only
 * for deadlines within the next 5 days, so the badge stays reserved for
 * genuinely time-sensitive roles rather than appearing on every card.
 * `lib/data/opportunities.ts`'s applyPublishedFilter() already excludes
 * anything past its deadline, so any value reaching here is still open.
 */
export function formatDeadlineUrgency(
  deadline: string | null,
): { label: string; level: "critical" | "soon" } | null {
  if (!deadline) return null;

  const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const today = new Date(`${todayKey}T00:00:00+05:30`).getTime();
  const due = new Date(`${deadline}T00:00:00+05:30`).getTime();
  if (Number.isNaN(due)) return null;

  const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0 || diffDays > 5) return null;
  if (diffDays === 0) return { label: "Closes today", level: "critical" };
  if (diffDays === 1) return { label: "Closes tomorrow", level: "critical" };
  return { label: `Closes in ${diffDays}d`, level: "soon" };
}
