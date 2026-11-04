// Abandoned-checkout reminder: one friendly email to a student who opened
// the Razorpay checkout (a `subscriptions` row with status "created") but
// didn't finish paying. Sent by app/api/cron/checkout-recovery, which a
// Supabase pg_cron job calls every 10 minutes (see supabase/schema.sql).
//
// Rules, so this never feels like spam:
//  - only for checkouts 20 minutes – 24 hours old,
//  - never to anyone who has since paid (access check at send time),
//  - never to anyone who unsubscribed from FirstOffer emails,
//  - at most ONE reminder per student per 7 days, whatever they retry.
// Needs RESEND_API_KEY + RESEND_FROM_EMAIL (same as the job alerts) and the
// `recovery_email_sent_at` column (see supabase/schema.sql).
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/site-url";
import { buildUnsubscribeUrl, getOptedOutUserIds } from "@/lib/data/email-preference";
import { hasFullAccess } from "@/lib/data/opportunity-unlocks";
import { hasInternalAccess } from "@/lib/data/subscriptions";
import { STUDENT_COUNT_LABEL } from "@/components/PlanTags";
import {
  FULL_ACCESS_SALE_END_LABEL,
  FULL_ACCESS_SALE_MRP_INR,
  INTERNAL_SALE_MRP_INR,
  getFullAccessPriceInr,
  getInternalPriceInr,
  isDiwaliOfferActive,
  isFullAccessSaleActive,
} from "@/lib/payments/razorpay";

const MIN_AGE_MINUTES = 20;
const MAX_AGE_HOURS = 24;
const COOLDOWN_DAYS = 7;
const WHATSAPP = "6363976632";

type Product = "full_access" | "internal_hr";

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
}

function copyFor(product: Product) {
  if (product === "internal_hr") {
    const price = getInternalPriceInr();
    const offer = isDiwaliOfferActive();
    return {
      subject: offer
        ? `Your Internal HR access is one step away — ₹${price} till ${FULL_ACCESS_SALE_END_LABEL}`
        : `Your Internal HR access is one step away`,
      heading: "You were one click away from Internal HR openings",
      price,
      was: offer ? INTERNAL_SALE_MRP_INR : undefined,
      period: "for 3 months",
      offerLine: offer ? `🪔 Diwali price — ends ${FULL_ACCESS_SALE_END_LABEL}` : undefined,
      benefits: [
        "Openings shared directly by HRs — low-competition roles",
        "Early access to fresh roles before they go public",
        "6 Interview Question Kits (PDF) to prepare faster",
        "One payment, no auto-debit",
      ],
      cta: `Complete my payment — ₹${price}`,
      path: "/internal-openings",
    };
  }
  const price = getFullAccessPriceInr();
  const offer = isFullAccessSaleActive();
  return {
    subject: offer
      ? `Your ₹${price} Full Access is waiting — offer ends ${FULL_ACCESS_SALE_END_LABEL}`
      : `Your FirstOffer Full Access is waiting`,
    heading: "You're one step away from applying directly to HRs",
    price,
    was: offer ? FULL_ACCESS_SALE_MRP_INR : undefined,
    period: "for 3 months",
    offerLine: offer ? `🪔 Diwali offer — ends ${FULL_ACCESS_SALE_END_LABEL}` : undefined,
    benefits: [
      "Direct HR emails & recruiter numbers on every opening",
      "Official Google Forms & apply links — no middlemen",
      "New fresher jobs & internships added every day",
      "Resume Keyword Matcher to check your fit before applying",
    ],
    cta: `Grab the offer — ₹${price}`,
    path: "/unlock",
  };
}

function renderHtml(product: Product, unsubscribeUrl: string): { subject: string; html: string } {
  const c = copyFor(product);
  const url = `${getSiteUrl()}${c.path}`;
  const wa = `https://wa.me/91${WHATSAPP}`;
  const items = c.benefits
    .map(
      (b) =>
        `<tr><td style="padding:6px 0;vertical-align:top;width:26px;color:#16a34a;font-weight:700;">✓</td><td style="padding:6px 0;font-size:15px;line-height:1.5;color:#1f2329;">${esc(b)}</td></tr>`,
    )
    .join("");
  const priceBlock = `
    <p style="margin:0;font-size:13px;color:#6b7280;">Your price</p>
    <p style="margin:4px 0 0;font-size:34px;font-weight:800;color:#111827;line-height:1;">₹${c.price}
      ${c.was ? `<span style="font-size:18px;font-weight:600;color:#9ca3af;text-decoration:line-through;margin-left:8px;">₹${c.was}</span>` : ""}
      <span style="font-size:14px;font-weight:600;color:#6b7280;margin-left:6px;">${c.period}</span>
    </p>
    ${c.offerLine ? `<p style="margin:10px 0 0;display:inline-block;padding:5px 12px;border-radius:999px;background:#fff7e6;border:1px solid #f5c26b;font-size:13px;font-weight:700;color:#92400e;">${esc(c.offerLine)}</p>` : ""}`;

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:28px 14px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr><td style="background:#0b0b10;padding:22px 28px;">
            <p style="margin:0;font-size:18px;font-weight:800;color:#ffffff;">FirstOffer</p>
            <p style="margin:4px 0 0;font-size:13px;color:#a1a1aa;">Trusted by ${esc(STUDENT_COUNT_LABEL)} students</p>
          </td></tr>
          <tr><td style="padding:26px 28px 0;">
            <h1 style="margin:0;font-size:22px;line-height:1.3;color:#111827;">${esc(c.heading)}</h1>
            <p style="margin:10px 0 0;font-size:15px;line-height:1.6;color:#4b5563;">
              You started checkout on FirstOffer but the payment didn't go through. No worries — your spot is still here.
            </p>
          </td></tr>
          <tr><td style="padding:20px 28px 0;">
            <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280;">What you get</p>
            <table role="presentation" cellpadding="0" cellspacing="0">${items}</table>
          </td></tr>
          <tr><td style="padding:20px 28px 0;">
            <div style="padding:18px;border-radius:14px;background:#f8fafc;border:1px solid #e5e7eb;">${priceBlock}</div>
          </td></tr>
          <tr><td style="padding:22px 28px 0;">
            <a href="${url}" style="display:block;text-align:center;background:#2563eb;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:15px 22px;border-radius:12px;">${esc(c.cta)} →</a>
            <p style="margin:10px 0 0;text-align:center;font-size:13px;color:#6b7280;">🔒 Secure payment by Razorpay · UPI, GPay, PhonePe, Paytm · No auto-debit</p>
          </td></tr>
          <tr><td style="padding:20px 28px 24px;">
            <p style="margin:0;font-size:14px;line-height:1.6;color:#4b5563;">
              Payment failed or money got deducted? Just reply to this email or WhatsApp us at
              <a href="${wa}" style="color:#16a34a;font-weight:700;text-decoration:none;">+91 63639 76632</a> — we'll sort it out the same day.
            </p>
          </td></tr>
          <tr><td style="padding:14px 28px 20px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af;">
              You're getting this one-time reminder because you started a checkout on FirstOffer.
              <a href="${unsubscribeUrl}" style="color:#9ca3af;">Unsubscribe</a>.
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
  return { subject: c.subject, html };
}

export async function sendCheckoutRecoveryEmails(): Promise<{
  configured: boolean;
  candidates: number;
  sent: number;
  skipped: number;
  errors: number;
}> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    console.error("Checkout reminders aren't configured — set RESEND_API_KEY and RESEND_FROM_EMAIL.");
    return { configured: false, candidates: 0, sent: 0, skipped: 0, errors: 0 };
  }
  const resend = new Resend(apiKey);
  const admin = createAdminClient();
  const now = Date.now();
  const newest = new Date(now - MIN_AGE_MINUTES * 60_000).toISOString();
  const oldest = new Date(now - MAX_AGE_HOURS * 3_600_000).toISOString();

  const { data: rows, error } = await admin
    .from("subscriptions")
    .select("id, user_id, product, created_at")
    .eq("status", "created")
    .is("recovery_email_sent_at", null)
    .lte("created_at", newest)
    .gte("created_at", oldest)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    console.error("Checkout reminders: could not read subscriptions:", error.message);
    return { configured: true, candidates: 0, sent: 0, skipped: 0, errors: 1 };
  }

  // One reminder per student: newest abandoned checkout decides the product.
  const byUser = new Map<string, { product: Product; ids: string[] }>();
  for (const r of rows ?? []) {
    const entry = byUser.get(r.user_id);
    if (entry) entry.ids.push(r.id);
    else byUser.set(r.user_id, { product: r.product === "internal_hr" ? "internal_hr" : "full_access", ids: [r.id] });
  }

  const optedOut = await getOptedOutUserIds(admin);
  const cooldownSince = new Date(now - COOLDOWN_DAYS * 86_400_000).toISOString();
  let sent = 0;
  let skipped = 0;
  let errors = 0;

  for (const [userId, { product, ids }] of byUser) {
    // Mark first, so a slow or repeated run can never email twice.
    const markAll = () =>
      admin.from("subscriptions").update({ recovery_email_sent_at: new Date().toISOString() }).in("id", ids);

    const { count: recent } = await admin
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("recovery_email_sent_at", cooldownSince);
    const paid = product === "internal_hr" ? await hasInternalAccess(userId) : await hasFullAccess(userId);

    if (optedOut.has(userId) || paid || (recent ?? 0) > 0) {
      await markAll();
      skipped += 1;
      continue;
    }

    const { data: u } = await admin.auth.admin.getUserById(userId);
    const email = u?.user?.email;
    await markAll();
    if (!email) {
      skipped += 1;
      continue;
    }

    const unsubscribeUrl = buildUnsubscribeUrl(userId);
    const { subject, html } = renderHtml(product, unsubscribeUrl);
    const { error: sendError } = await resend.emails.send({
      from,
      to: email,
      replyTo: "support@firstoffer.online",
      subject,
      html,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    if (sendError) {
      console.error("Checkout reminder failed:", sendError.message);
      errors += 1;
    } else {
      sent += 1;
    }
    // Resend's default limit is 2 requests/second.
    await new Promise((r) => setTimeout(r, 600));
  }

  return { configured: true, candidates: byUser.size, sent, skipped, errors };
}
