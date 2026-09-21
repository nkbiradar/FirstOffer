// Sends "new opportunity" email alerts to every signed-up user, by whatever
// address they logged in with (Google OAuth via Supabase Auth — no separate
// profiles table, so recipients come straight from auth.admin.listUsers()).
// Mirrors lib/push/web-push-client.ts's shape and fail-soft convention: this
// never throws, so an email problem can never break the admin publish flow
// that calls it.
//
// Requires RESEND_API_KEY and RESEND_FROM_EMAIL (e.g.
// "FirstOffer <alerts@firstoffer.online>" — the domain must be verified in
// the Resend dashboard, or mail to real inboxes will bounce). Also needs
// EMAIL_UNSUB_SECRET (any random string) to sign one-click unsubscribe
// links — see lib/data/email-preference.ts. Until all three are set,
// sendEmailToAllUsers() logs a clear message and does nothing.
import { Resend, type CreateBatchOptions } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/site-url";
import { buildUnsubscribeUrl, getOptedOutUserIds } from "@/lib/data/email-preference";

export type EmailPayload = {
  subject: string;
  heading: string;
  body: string;
  ctaLabel: string;
  /** Relative path, e.g. "/opportunities/<id>" or "/internal-openings". */
  url: string;
  /** Gold "premium" accent for Internal HR alerts; teal (default) otherwise. */
  accent?: "teal" | "gold";
};

// Resend's batch endpoint accepts at most 100 emails per call.
const BATCH_SIZE = 100;

// Resend's default plan allows 2 requests/second across the whole account.
// notifySingleOpportunity() (lib/notify/new-opportunity-alerts.ts) fires one
// of these per admin "+Add Opportunity" action, each running independently
// via after() — so a few opportunities added within the same second or two
// leads to concurrent /emails/batch calls that exceed that limit. This is
// what actually surfaces as 429s in the Resend dashboard.
const MAX_RETRY_ATTEMPTS = 4;

let client: Resend | null = null;

function getClient(): Resend | null {
  if (client) return client;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  client = new Resend(apiKey);
  return client;
}

function renderHtml(payload: EmailPayload, unsubscribeUrl: string): string {
  const accentColor = payload.accent === "gold" ? "#b9790a" : "#0d9488";
  const ctaUrl = `${getSiteUrl()}${payload.url}`;

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#fafafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafb;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e7e8ec;">
            <tr>
              <td style="padding:28px 28px 0 28px;">
                <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${accentColor};">FirstOffer</p>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 28px 0 28px;">
                <h1 style="margin:0;font-size:20px;line-height:1.35;color:#14161a;">${payload.heading}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 28px 0 28px;">
                <p style="margin:0;font-size:15px;line-height:1.6;color:#4b4f58;">${payload.body}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 28px 28px;">
                <a href="${ctaUrl}" style="display:inline-block;background:${accentColor};color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 22px;border-radius:10px;">${payload.ctaLabel}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 24px 28px;border-top:1px solid #e7e8ec;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#9a9ea8;">
                  You're getting this because you're signed in on FirstOffer.
                  <a href="${unsubscribeUrl}" style="color:#9a9ea8;">Unsubscribe from these alerts</a>.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The Resend SDK never throws for an API-level error (including a rate
// limit) — every call resolves { data, error, headers }, error included.
// A bare `await resend.batch.send(...)` inside try/catch, as this used to
// be written, therefore never actually saw a 429: it resolved normally,
// the unread `error` field was silently discarded, and that batch of
// alert emails just never went out. This checks `error` explicitly and,
// for a 429 specifically, retries with backoff — using the `Retry-After`
// header Resend sends (in seconds) when present, since that's a more
// accurate wait than guessing.
async function sendBatchWithRetry(
  resend: Resend,
  chunkPayload: CreateBatchOptions,
  attempt = 0,
): Promise<void> {
  const { error, headers } = await resend.batch.send(chunkPayload);
  if (!error) return;

  if (error.statusCode === 429 && attempt < MAX_RETRY_ATTEMPTS) {
    const retryAfterSeconds = Number(headers?.["retry-after"]);
    const delayMs = Number.isFinite(retryAfterSeconds) ? retryAfterSeconds * 1000 : 500 * 2 ** attempt;
    await sleep(delayMs);
    return sendBatchWithRetry(resend, chunkPayload, attempt + 1);
  }

  console.error(`Email batch send failed (status ${error.statusCode ?? "unknown"}, ${error.name}):`, error.message);
}

/**
 * Emails every signed-up user (minus anyone who's opted out) about a newly
 * published opportunity. Best-effort, chunked into batches of 100 — a
 * failed chunk is logged and skipped rather than aborting the rest. A 429
 * (rate limit) is retried with backoff instead of being dropped — see
 * sendBatchWithRetry() above for why that didn't already happen.
 */
export async function sendEmailToAllUsers(payload: EmailPayload): Promise<void> {
  const resend = getClient();
  const from = process.env.RESEND_FROM_EMAIL;
  if (!resend || !from) {
    console.error("Email alerts aren't configured — set RESEND_API_KEY and RESEND_FROM_EMAIL.");
    return;
  }

  const admin = createAdminClient();
  const optedOut = await getOptedOutUserIds(admin);

  const recipients: { userId: string; email: string }[] = [];
  const perPage = 200;
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error("Could not list users for email alert:", error.message);
      break;
    }
    for (const user of data.users) {
      if (user.email && !optedOut.has(user.id)) {
        recipients.push({ userId: user.id, email: user.email });
      }
    }
    if (data.users.length < perPage) break;
    page += 1;
  }

  if (recipients.length === 0) return;

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const chunk = recipients.slice(i, i + BATCH_SIZE);
    const chunkPayload: CreateBatchOptions = chunk.map((recipient) => {
      const unsubscribeUrl = buildUnsubscribeUrl(recipient.userId);
      return {
        from,
        to: recipient.email,
        subject: payload.subject,
        html: renderHtml(payload, unsubscribeUrl),
        // The footer link above is for a human reading the email; these
        // headers are for the mail client itself. Gmail/Outlook/Yahoo
        // all read List-Unsubscribe to show their own native
        // "Unsubscribe" button next to the sender name, and
        // List-Unsubscribe-Post (RFC 8058) tells them it's safe to fire
        // that instantly with no confirmation page — see the POST
        // handler in app/api/email/unsubscribe/route.ts, added
        // specifically to answer that request. Having both is one of
        // the concrete, checkable signals mailbox providers use when
        // deciding inbox vs spam for bulk-style senders; it's not a
        // guarantee by itself, since a lot of the rest is sender/domain
        // reputation building up over time.
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      };
    });

    try {
      await sendBatchWithRetry(resend, chunkPayload);
    } catch (err) {
      // Defense in depth only — sendBatchWithRetry resolves rather than
      // throws for every case the Resend SDK itself can produce (see its
      // comment above); this is here for a genuinely unexpected exception.
      console.error("Email batch send failed:", err instanceof Error ? err.message : err);
    }
  }
}
