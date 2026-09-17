import { sendPushToAllSubscribers } from "@/lib/push/web-push-client";
import { sendEmailToAllUsers } from "@/lib/email/resend-client";
import type { Opportunity } from "@/types/supabase";

// Fires the "go fast and apply" push + email pair whenever new
// opportunities go live — shared by the single "+Add Opportunity" route
// (app/api/admin/opportunities/route.ts) and the bulk-import route
// (app/api/admin/opportunities/bulk/route.ts) so the two paths can't drift
// out of sync. Internal HR openings (opportunity.is_internal) get their
// own generic wording that never names the role or company — matching the
// "mystery" design on /internal-openings (see getInternalOpportunities/
// applyInternalFilter in lib/data/opportunities.ts) — and link to
// /internal-openings instead of the (unlisted, noindexed) opportunity
// page itself. Both push and email are fire-and-forget: never awaited by
// callers, and neither ever throws.

export function notifySingleOpportunity(opportunity: Opportunity): void {
  if (opportunity.is_internal) {
    void sendPushToAllSubscribers({
      title: "🔥 New Internal HR opening just added!",
      body: "Unlock Internal HR Openings to see it before anyone else.",
      url: "/internal-openings",
    });
    void sendEmailToAllUsers({
      subject: "🔥 New Internal HR opening just added — FirstOffer",
      heading: "A new Internal HR opening just went live",
      body: "An HR shared it directly with FirstOffer — it likely isn't posted anywhere else. Unlock Internal HR Openings to see the company and role before it fills up.",
      ctaLabel: "View Internal Openings",
      url: "/internal-openings",
      accent: "gold",
    });
    return;
  }

  void sendPushToAllSubscribers({
    title: "1 new opportunity just added!",
    body: `${opportunity.role} — go fast and apply before it's gone.`,
    url: `/opportunities/${opportunity.id}`,
  });
  void sendEmailToAllUsers({
    subject: `New opportunity: ${opportunity.role} — FirstOffer`,
    heading: "A new opportunity just went live",
    body: `${opportunity.role} was just published on FirstOffer. Go fast and apply before it's gone.`,
    ctaLabel: "View Opportunity",
    url: `/opportunities/${opportunity.id}`,
  });
}

export function notifyBulkOpportunities(counts: { public: number; internal: number }): void {
  if (counts.public > 0) {
    void sendPushToAllSubscribers({
      title: counts.public === 1 ? "1 new opportunity just added!" : `${counts.public} new opportunities just added!`,
      body: "Go fast and apply before they're gone.",
      url: "/opportunities",
    });
    void sendEmailToAllUsers({
      subject:
        counts.public === 1
          ? "1 new opportunity just added — FirstOffer"
          : `${counts.public} new opportunities just added — FirstOffer`,
      heading:
        counts.public === 1 ? "1 new opportunity just went live" : `${counts.public} new opportunities just went live`,
      body: "Go fast and apply before they're gone.",
      ctaLabel: "Browse Opportunities",
      url: "/opportunities",
    });
  }

  if (counts.internal > 0) {
    void sendPushToAllSubscribers({
      title:
        counts.internal === 1
          ? "🔥 New Internal HR opening just added!"
          : `🔥 ${counts.internal} new Internal HR openings just added!`,
      body: "Unlock Internal HR Openings to see them before anyone else.",
      url: "/internal-openings",
    });
    void sendEmailToAllUsers({
      subject:
        counts.internal === 1
          ? "🔥 New Internal HR opening just added — FirstOffer"
          : `🔥 ${counts.internal} new Internal HR openings just added — FirstOffer`,
      heading: "New Internal HR openings just went live",
      body: "HRs shared these directly with FirstOffer. Unlock Internal HR Openings to see the companies and roles before they fill up.",
      ctaLabel: "View Internal Openings",
      url: "/internal-openings",
      accent: "gold",
    });
  }
}
