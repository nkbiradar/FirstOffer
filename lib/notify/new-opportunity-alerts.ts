import { after } from "next/server";
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
// page itself.
//
// Both push and email run via Next's after() rather than a bare
// fire-and-forget `void`. On Vercel, once a route handler's response is
// sent, the function's execution can be frozen mid-flight — a `void`'d
// promise that's still listing users / calling Resend at that moment can
// simply never finish, with no error anywhere (this is exactly what caused
// a 5-item bulk publish of public opportunities to create everything
// correctly but never send the "new opportunity" email, while a
// single-item add usually finished in time and looked fine). after()
// keeps the function alive until this work genuinely completes, and never
// delays or affects the response itself — the admin still gets an
// instant redirect/JSON reply either way. Neither underlying send ever
// throws (see their own files), so a delivery failure still can't break
// the publish flow.
function notifyPush(payload: Parameters<typeof sendPushToAllSubscribers>[0]): void {
  after(() => sendPushToAllSubscribers(payload));
}

function notifyEmail(payload: Parameters<typeof sendEmailToAllUsers>[0]): void {
  after(() => sendEmailToAllUsers(payload));
}

export function notifySingleOpportunity(opportunity: Opportunity): void {
  if (opportunity.is_internal) {
    notifyPush({
      title: "🔥 New Internal HR opening just added!",
      body: "Unlock Internal HR Openings to see it before anyone else.",
      url: "/internal-openings",
    });
    notifyEmail({
      subject: "🔥 New Internal HR opening just added — FirstOffer",
      heading: "A new Internal HR opening just went live",
      body: "An HR shared it directly with FirstOffer — it likely isn't posted anywhere else. Unlock Internal HR Openings to see the company and role before it fills up.",
      ctaLabel: "View Internal Openings",
      url: "/internal-openings",
      accent: "gold",
    });
    return;
  }

  notifyPush({
    title: "🔥 New opportunity just added!",
    body: `${opportunity.role} — go fast and apply before it's gone.`,
    url: `/opportunities/${opportunity.id}`,
  });
  notifyEmail({
    subject: `🔥 New opportunity: ${opportunity.role} — FirstOffer`,
    heading: "A new opportunity just went live",
    body: `${opportunity.role} was just published on FirstOffer. Go fast and apply before it's gone.`,
    ctaLabel: "View Opportunity",
    url: `/opportunities/${opportunity.id}`,
  });
}

export function notifyBulkOpportunities(counts: { public: number; internal: number }): void {
  if (counts.public > 0) {
    notifyPush({
      title:
        counts.public === 1 ? "🔥 New opportunity just added!" : `🔥 ${counts.public} new opportunities just added!`,
      body: "Go fast and apply before they're gone.",
      url: "/opportunities",
    });
    notifyEmail({
      subject:
        counts.public === 1
          ? "🔥 New opportunity just added — FirstOffer"
          : `🔥 ${counts.public} new opportunities just added — FirstOffer`,
      heading:
        counts.public === 1 ? "New opportunity just went live" : `${counts.public} new opportunities just went live`,
      body: "Go fast and apply before they're gone.",
      ctaLabel: "Browse Opportunities",
      url: "/opportunities",
    });
  }

  if (counts.internal > 0) {
    notifyPush({
      title:
        counts.internal === 1
          ? "🔥 New Internal HR opening just added!"
          : `🔥 ${counts.internal} new Internal HR openings just added!`,
      body: "Unlock Internal HR Openings to see them before anyone else.",
      url: "/internal-openings",
    });
    notifyEmail({
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
