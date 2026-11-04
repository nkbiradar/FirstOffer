// One place that sends a single email: the Hostinger mailbox over SMTP
// (SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS — same as
// lib/email/admin-notify.ts), with Resend as a fallback when SMTP isn't set.
// Used by the checkout reminder and the admin broadcast queue so they don't
// eat into Resend's monthly quota that the job alerts rely on.
import nodemailer from "nodemailer";
import { Resend } from "resend";

export type Mail = { to: string; subject: string; html: string; headers?: Record<string, string> };
/** Resolves to null on success, or an error message. */
export type Sender = (mail: Mail) => Promise<string | null>;

export function getSender(fromName = "Team FirstOffer"): Sender | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (host && user && pass) {
    const port = Number(process.env.SMTP_PORT ?? 465);
    const transport = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
    return async (m) => {
      try {
        await transport.sendMail({
          from: `${fromName} <${user}>`,
          to: m.to,
          replyTo: user,
          subject: m.subject,
          html: m.html,
          headers: m.headers,
        });
        return null;
      } catch (err) {
        return err instanceof Error ? err.message : String(err);
      }
    };
  }
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (apiKey && from) {
    const resend = new Resend(apiKey);
    const addr = from.match(/<([^>]+)>/)?.[1] ?? from.trim();
    return async (m) => {
      const { error } = await resend.emails.send({
        from: `${fromName} <${addr}>`,
        to: m.to,
        replyTo: "support@firstoffer.online",
        subject: m.subject,
        html: m.html,
        headers: m.headers,
      });
      return error ? `${error.name}: ${error.message}` : null;
    };
  }
  return null;
}

/** "Nayan Kumar" → "Nayan"; "" when there's no usable name. */
export function firstNameOf(meta: Record<string, unknown> | undefined): string {
  const full = String(meta?.full_name ?? meta?.name ?? "").trim();
  const first = full.split(/\s+/)[0] ?? "";
  return /^[\p{L}.'-]{2,20}$/u.test(first) ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : "";
}
