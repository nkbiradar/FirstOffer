import { getHomepageOpportunities } from "@/lib/data/opportunities";
import { getSiteUrl } from "@/lib/site-url";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Plain RSS 2.0 feed of the latest published opportunities — no dependency
// needed, it's just an XML string. Refreshes on every request (opportunities
// change daily, so there's no need for caching here).
export async function GET() {
  const siteUrl = getSiteUrl();
  const { today, earlier } = await getHomepageOpportunities(50);
  const opportunities = [...today, ...earlier];

  const items = opportunities
    .map((opportunity) => {
      const link = `${siteUrl}/opportunities/${opportunity.id}`;
      const titleText = opportunity.company?.name
        ? `${opportunity.role} at ${opportunity.company.name}`
        : opportunity.role;
      const pubDate = new Date(opportunity.published_at ?? opportunity.created_at).toUTCString();
      const description = [opportunity.location, opportunity.work_mode, opportunity.stipend || opportunity.salary]
        .filter(Boolean)
        .join(" · ");

      return `    <item>
      <title>${escapeXml(titleText)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(description)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>FirstOffer — Fresher Opportunities</title>
    <link>${siteUrl}</link>
    <description>Latest internships and full-time opportunities for freshers, collected in one place.</description>
    <language>en-in</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
