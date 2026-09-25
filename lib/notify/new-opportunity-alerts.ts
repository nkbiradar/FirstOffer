import { after } from "next/server";
import { sendPushToAllSubscribers } from "@/lib/push/web-push-client";
import type { Opportunity } from "@/types/supabase";

// Fires the "go fast and apply" push notification whenever new
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
// Email intentionally does NOT fire from here anymore. It used to (one
// instant broadcast to every user per publish, ~38/day), which is exactly
// what was hitting Resend's rate limit and daily/monthly caps (429s in its
// Logs tab). Every published opportunity now just waits with
// email_digest_sent_at = null until the daily digest cron
// (app/api/cron/email-digest/route.ts, see vercel.json) picks it up and
// sends ONE combined email per audience instead of one per opportunity —
// see lib/email/opportunity-digest.ts. Push is unaffected: it isn't what
// was rate-limited, so it still fires instantly here.
//
// Push runs via Next's after() rather than a bare fire-and-forget `void`.
// On Vercel, once a route handler's response is sent, the function's
// execution can be frozen mid-flight — a `void`'d promise still calling
// the push service at that moment can simply never finish, with no error
// anywhere. after() keeps the function alive until this work genuinely
// completes, and never delays or affects the response itself — the admin
// still gets an instant redirect/JSON reply either way. sendPushToAllSubscribers()
// never throws, so a delivery failure still can't break the publish flow.
function notifyPush(payload: Parameters<typeof sendPushToAllSubscribers>[0]): void {
  after(() => sendPushToAllSubscribers(payload));
}

export function notifySingleOpportunity(opportunity: Opportunity): void {
  if (opportunity.is_internal) {
    notifyPush({
      title: "🔥 New Internal HR opening just added!",
      body: "Unlock Internal HR Openings to see it before anyone else.",
      url: "/internal-openings",
    });
    return;
  }

  notifyPush({
    title: "🔥 New opportunity just added!",
    body: `${opportunity.role} — go fast and apply before it's gone.`,
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
  }
}
