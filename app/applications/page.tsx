import { redirect } from "next/navigation";

// /applications was the original "My Applications" page — replaced by the
// richer /dashboard (stat tiles, status filter, unlocked-opportunities
// panel) built on the same data. Kept as a redirect rather than deleted so
// any bookmarked/shared /applications links keep working.
export default function ApplicationsRedirect() {
  redirect("/dashboard");
}
