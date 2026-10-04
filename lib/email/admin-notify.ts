import nodemailer from "nodemailer";
import { Resend } from "resend";
import { getSiteUrl } from "@/lib/site-url";

// One-off notification emails to the admin (e.g. a new /share-your-story
// submission). Never throws: a failed notification must not fail the
// user's action that triggered it.
//
// Preferred: the FirstOffer Hostinger mailbox over SMTP —
//   SMTP_HOST=smtp.hostinger.com  SMTP_PORT=465
//   SMTP_USER=support@firstoffer.online  SMTP_PASS=<mailbox password>
//   ADMIN_NOTIFY_EMAIL=support@firstoffer.online   (optional, defaults to SMTP_USER)
// Sent FROM SMTP_USER TO ADMIN_NOTIFY_EMAIL.
// Fallback (only if SMTP isn't configured): Resend, using RESEND_API_KEY +
// RESEND_FROM_EMAIL, sent to ADMIN_EMAILS.

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function notifyAdmins(subject: string, rows: [string, string][], ctaPath: string, ctaLabel: string) {
  const tableRows = rows
    .filter(([, value]) => value)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#8b8f98;font-size:13px;white-space:nowrap;vertical-align:top">${escapeHtml(label)}</td><td style="padding:6px 0;color:#14161a;font-size:14px">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  const html = `<!doctype html><html><body style="margin:0;background:#fafafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:28px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border:1px solid #e7e8ec;border-radius:14px;padding:28px">
<tr><td style="font-size:20px;font-weight:700;color:#14161a;padding-bottom:16px">${escapeHtml(subject)}</td></tr>
<tr><td><table role="presentation" cellpadding="0" cellspacing="0">${tableRows}</table></td></tr>
<tr><td style="padding-top:22px"><a href="${getSiteUrl()}${ctaPath}" style="display:inline-block;background:#4338ca;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:999px">${escapeHtml(ctaLabel)}</a></td></tr>
</table></td></tr></table></body></html>`;

  // 1) Hostinger mailbox over SMTP.
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (smtpHost && smtpUser && smtpPass) {
    const port = Number(process.env.SMTP_PORT ?? 465);
    const to = process.env.ADMIN_NOTIFY_EMAIL || smtpUser;
    try {
      const transport = nodemailer.createTransport({
        host: smtpHost,
        port,
        secure: port === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });
      await transport.sendMail({ from: `FirstOffer <${smtpUser}>`, to, subject, html });
    } catch (err) {
      console.error("Admin notification (SMTP) failed:", err);
    }
    return;
  }

  // 2) Fallback: Resend.
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
  if (!apiKey || !from || to.length === 0) {
    console.error(
      "Admin notification skipped — set SMTP_HOST/SMTP_USER/SMTP_PASS (Hostinger) or RESEND_API_KEY/RESEND_FROM_EMAIL.",
    );
    return;
  }
  try {
    const { error } = await new Resend(apiKey).emails.send({ from, to, subject, html });
    if (error) console.error("Admin notification failed:", error.message);
  } catch (err) {
    console.error("Admin notification threw:", err);
  }
}
