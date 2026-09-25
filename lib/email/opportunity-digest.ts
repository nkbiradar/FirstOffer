// Batches every "new opportunity" email into ONE send per audience per run,
// instead of one broadcast per opportunity. See the email_digest_sent_at
// migration block at the end of supabase/schema.sql for the full story on
// why this exists (Resend 429s from ~38 instant broadcasts/day) and
// app/api/cron/email-digest/route.ts for what calls this.
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmailToAllUsers } from "@/lib/email/resend-client";
import type { Opportunity } from "@/types/supabase";

type PendingOpportunity = Opportunity & {
  company: { name: string | null } | { name: string | null }[] | null;
};

// How many role/company names to spell out in the email body before
// collapsing the rest into "+N more" — keeps the digest readable even on
// a day with 30+ new postings.
const MAX_NAMED_IN_BODY = 8;

function companyName(row: PendingOpportunity): string | null {
  const company = Array.isArray(row.company) ? row.company[0] : row.company;
  return company?.name ?? null;
}

function describeRoles(rows: PendingOpportunity[]): string {
  const names = rows.map((row) => {
    const company = companyName(row);
    return company ? `${row.role} @ ${company}` : row.role;
  });
  const shown = names.slice(0, MAX_NAMED_IN_BODY);
  const remaining = names.length - shown.length;
  return remaining > 0 ? `${shown.join(", ")}, and ${remaining} more.` : `${shown.join(", ")}.`;
}

/**
 * Finds every published opportunity still waiting on its digest email,
 * sends at most two emails total (one for public opportunities, one for
 * Internal HR openings — never one per opportunity), then stamps every
 * opportunity it just covered so this run's items are never re-sent.
 *
 * Best-effort like the rest of the email code: sendEmailToAllUsers() never
 * throws, so a Resend-side failure here can't leave this function crashing
 * out mid-way — worst case, those opportunities stay unstamped and go out
 * in the next run instead.
 */
export async function sendOpportunityDigest(): Promise<{ public: number; internal: number }> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("opportunities")
    .select("*, company:companies(name)")
    .eq("status", "published")
    .is("email_digest_sent_at", null)
    .not("published_at", "is", null)
    .order("published_at", { ascending: true });

  if (error) {
    console.error("sendOpportunityDigest: could not load pending opportunities:", error.message);
    return { public: 0, internal: 0 };
  }

  const pending = (data ?? []) as PendingOpportunity[];
  if (pending.length === 0) return { public: 0, internal: 0 };

  const publicOnes = pending.filter((row) => !row.is_internal);
  const internalOnes = pending.filter((row) => row.is_internal);

  if (publicOnes.length > 0) {
    await sendEmailToAllUsers({
      subject:
        publicOnes.length === 1
          ? "🔥 New opportunity just added — FirstOffer"
          : `🔥 ${publicOnes.length} new opportunities just added — FirstOffer`,
      heading:
        publicOnes.length === 1 ? "A new opportunity just went live" : `${publicOnes.length} new opportunities just went live`,
      body: `${describeRoles(publicOnes)} Go fast and apply before they're gone.`,
      ctaLabel: "Browse Opportunities",
      url: "/opportunities",
    });
  }

  if (internalOnes.length > 0) {
    await sendEmailToAllUsers({
      subject:
        internalOnes.length === 1
          ? "🔥 New Internal HR opening just added — FirstOffer"
          : `🔥 ${internalOnes.length} new Internal HR openings just added — FirstOffer`,
      heading:
        internalOnes.length === 1
          ? "A new Internal HR opening just went live"
          : `${internalOnes.length} new Internal HR openings just went live`,
      body: "HRs shared these directly with FirstOffer — they likely aren't posted anywhere else. Unlock Internal HR Openings to see the companies and roles before they fill up.",
      ctaLabel: "View Internal Openings",
      url: "/internal-openings",
      accent: "gold",
    });
  }

  const sentAt = new Date().toISOString();
  const pendingIds = pending.map((row) => row.id);
  const { error: stampError } = await admin
    .from("opportunities")
    .update({ email_digest_sent_at: sentAt })
    .in("id", pendingIds);

  if (stampError) {
    console.error("sendOpportunityDigest: could not stamp sent opportunities:", stampError.message);
  }

  return { public: publicOnes.length, internal: internalOnes.length };
}
