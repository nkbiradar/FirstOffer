import { Resend } from "resend";
import { getSiteUrl } from "@/lib/site-url";

// One-off notification emails to the admin(s) listed in ADMIN_EMAILS, sent
// through the same Resend account as the user alerts (RESEND_API_KEY +
// RESEND_FROM_EMAIL, see lib/email/resend-client.ts). Never throws: a
// failed notification must not fail the user's action that triggered it.

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function notifyAdmins(subject: string, rows: [string, string][], ctaPath: string, ctaLabel: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
  if (!apiKey || !from || to.length === 0) {
    console.error("Admin notification skipped — set RESEND_API_KEY, RESEND_FROM_EMAIL and ADMIN_EMAILS.");
    return;
  }

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

  try {
    const { error } = await new Resend(apiKey).emails.send({ from, to, subject, html });
    if (error) console.error("Admin notification failed:", error.message);
  } catch (err) {
    console.error("Admin notification threw:", err);
  }
}
