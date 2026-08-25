/**
 * Base site URL for absolute links (sitemap, RSS feed, canonical/OG tags).
 * Falls back to localhost so nothing breaks before NEXT_PUBLIC_SITE_URL is
 * set — see the deployment note in the project doc / delivery report for
 * how to fill this in for production.
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}
