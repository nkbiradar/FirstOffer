import { getSiteStatsCached } from "@/lib/data/cached";
import { formatStudentCount, STUDENT_COUNT_FALLBACK_LABEL } from "@/lib/student-count";

/** Server-side: the live "2100+"-style label (cached with the other site stats, ~5 min). */
export async function getStudentCountLabel(): Promise<string> {
  try {
    const stats = await getSiteStatsCached();
    return formatStudentCount(stats.totalSubscribers);
  } catch {
    return STUDENT_COUNT_FALLBACK_LABEL;
  }
}
