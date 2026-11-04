// Admin "Email users" campaigns, sent through the Hostinger mailbox in small
// batches. The admin page queues one row per recipient in `email_queue`
// (see supabase/schema.sql); the 10-minute cron (app/api/cron/checkout-recovery)
// sends up to QUEUE_BATCH of them per run, never more than EMAIL_DAILY_LIMIT
// in any 24 hours, so the mailbox stays inside Hostinger's sending limit and
// out of spam folders. `{Name}` in the subject or message becomes the
// student's first name ("there" when unknown).
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/site-url";
import { buildUnsubscribeUrl, getOptedOutUserIds } from "@/lib/data/email-preference";
import { getPaidUserIds } from "@/lib/data/paid-users";
import { firstNameOf, getSender } from "@/lib/email/smtp-sender";

export type Audience = "all" | "paid" | "unpaid";
export type BroadcastInput = { subject: string; heading: string; message: string; ctaLabel: string; ctaUrl: string };

const QUEUE_BATCH = 30;
const DEFAULT_DAILY_LIMIT = 700;

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function withName(text: string, firstName: string): string {
  return text.replace(/\{name\}/gi, firstName || "there");
}

/** Plain text → safe HTML: escaped, URLs linked, line breaks kept. */
function toHtml(text: string): string {
  return esc(text)
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#2563eb;font-weight:600;">$1</a>')
    .replace(/\r?\n/g, "<br>");
}

export function renderBroadcast(input: BroadcastInput, firstName: string, unsubscribeUrl: string) {
  const subject = withName(input.subject, firstName);
  const heading = withName(input.heading || input.subject, firstName);
  const body = toHtml(withName(input.message, firstName));
  const ctaUrl = /^https?:\/\//i.test(input.ctaUrl) ? input.ctaUrl : `${getSiteUrl()}${input.ctaUrl || "/"}`;
  const cta = input.ctaLabel
    ? `<tr><td style="padding:22px 28px 0;"><a href="${esc(ctaUrl)}" style="display:block;text-align:center;background:#2563eb;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:15px 22px;border-radius:12px;">${esc(withName(input.ctaLabel, firstName))}</a></td></tr>`
    : "";
  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:24px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr><td style="background:#0b0b10;padding:22px 28px;">
            <p style="margin:0;font-size:19px;font-weight:800;color:#ffffff;">FirstOffer</p>
            <p style="margin:12px 0 0;font-size:22px;line-height:1.3;font-weight:800;color:#ffffff;">${esc(heading)}</p>
          </td></tr>
          <tr><td style="padding:24px 28px 0;font-size:15px;line-height:1.7;color:#374151;">${body}</td></tr>
          ${cta}
          <tr><td style="padding:20px 28px 22px;">
            <div style="padding:14px 16px;border-radius:12px;background:#f0fdf4;border:1px solid #bbf7d0;">
              <p style="margin:0;font-size:14px;line-height:1.6;color:#14532d;">💬 Need help, have a doubt or facing any issue? One of our team members is available on WhatsApp — feel free to reach out anytime.</p>
              <a href="https://wa.me/916363976632" style="display:inline-block;margin-top:10px;padding:8px 14px;border-radius:999px;background:#16a34a;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">WhatsApp +91 63639 76632</a>
            </div>
          </td></tr>
          <tr><td style="padding:14px 28px 20px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af;">You're getting this because you signed up on FirstOffer. <a href="${esc(unsubscribeUrl)}" style="color:#9ca3af;">Unsubscribe</a>.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
  return { subject, html };
}

/** Sends one test right away to the admin. */
export async function sendBroadcastTest(
  input: BroadcastInput,
  to: { email: string; userId: string; meta?: Record<string, unknown> },
): Promise<string | null> {
  const send = getSender();
  if (!send) return "Email isn't configured — set SMTP_HOST/SMTP_USER/SMTP_PASS.";
  const unsub = buildUnsubscribeUrl(to.userId);
  const { subject, html } = renderBroadcast(input, firstNameOf(to.meta), unsub);
  return send({ to: to.email, subject: `[TEST] ${subject}`, html });
}

/** Queues one email per matching signed-up user. Returns how many were queued. */
export async function queueBroadcast(input: BroadcastInput, audience: Audience): Promise<{ queued: number; error?: string }> {
  const admin = createAdminClient();
  const optedOut = await getOptedOutUserIds(admin);
  const paidSets = audience === "all" ? null : await getPaidUserIds(admin);
  const isPaid = (id: string) => Boolean(paidSets && (paidSets.fullAccess.has(id) || paidSets.internal.has(id)));
  const campaign = `${new Date().toISOString().slice(0, 16)} ${input.subject.slice(0, 60)}`;

  const rows: { campaign: string; user_id: string; email: string; subject: string; html: string; unsubscribe_url: string }[] = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return { queued: 0, error: `Could not list users: ${error.message}` };
    for (const u of data.users) {
      if (!u.email || optedOut.has(u.id)) continue;
      if (audience === "paid" && !isPaid(u.id)) continue;
      if (audience === "unpaid" && isPaid(u.id)) continue;
      const unsub = buildUnsubscribeUrl(u.id);
      const { subject, html } = renderBroadcast(input, firstNameOf(u.user_metadata), unsub);
      rows.push({ campaign, user_id: u.id, email: u.email.toLowerCase(), subject, html, unsubscribe_url: unsub });
    }
    if (data.users.length < 200) break;
  }

  let queued = 0;
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200);
    const { error } = await admin.from("email_queue").upsert(chunk, { onConflict: "campaign,email", ignoreDuplicates: true });
    if (error) return { queued, error: `Could not queue emails: ${error.message}` };
    queued += chunk.length;
  }
  return { queued };
}

function dailyLimit(): number {
  const n = Number(process.env.EMAIL_DAILY_LIMIT);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_DAILY_LIMIT;
}

/** Sends the next small batch from the queue (called by the 10-minute cron). */
export async function processEmailQueue(): Promise<{ sent: number; failed: number; pending: number; capped: boolean }> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const [{ count: sentToday }, { count: pending }] = await Promise.all([
    admin.from("email_queue").select("id", { count: "exact", head: true }).gte("sent_at", since),
    admin.from("email_queue").select("id", { count: "exact", head: true }).is("sent_at", null),
  ]);
  const room = Math.max(0, dailyLimit() - (sentToday ?? 0));
  if (!pending) return { sent: 0, failed: 0, pending: 0, capped: false };
  if (room === 0) return { sent: 0, failed: 0, pending: pending ?? 0, capped: true };

  const send = getSender();
  if (!send) return { sent: 0, failed: 0, pending: pending ?? 0, capped: false };

  const { data: batch } = await admin
    .from("email_queue")
    .select("id, email, subject, html, unsubscribe_url")
    .is("sent_at", null)
    .order("id", { ascending: true })
    .limit(Math.min(QUEUE_BATCH, room));

  let sent = 0;
  let failed = 0;
  for (const row of batch ?? []) {
    // Claim the row first so an overlapping run can never send it twice.
    const { data: claimed } = await admin
      .from("email_queue")
      .update({ sent_at: new Date().toISOString() })
      .eq("id", row.id)
      .is("sent_at", null)
      .select("id");
    if (!claimed?.length) continue;
    const err = await send({
      to: row.email,
      subject: row.subject,
      html: row.html,
      headers: row.unsubscribe_url
        ? { "List-Unsubscribe": `<${row.unsubscribe_url}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" }
        : undefined,
    });
    if (err) {
      failed += 1;
      await admin.from("email_queue").update({ error: err.slice(0, 500) }).eq("id", row.id);
    } else {
      sent += 1;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return { sent, failed, pending: Math.max(0, (pending ?? 0) - sent - failed), capped: false };
}

/** Numbers for the admin page. */
export async function getQueueStatus(): Promise<{ pending: number; sentToday: number; failedToday: number; limit: number }> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const [p, s, f] = await Promise.all([
    admin.from("email_queue").select("id", { count: "exact", head: true }).is("sent_at", null),
    admin.from("email_queue").select("id", { count: "exact", head: true }).gte("sent_at", since).is("error", null),
    admin.from("email_queue").select("id", { count: "exact", head: true }).gte("sent_at", since).not("error", "is", null),
  ]);
  return { pending: p.count ?? 0, sentToday: s.count ?? 0, failedToday: f.count ?? 0, limit: dailyLimit() };
}
