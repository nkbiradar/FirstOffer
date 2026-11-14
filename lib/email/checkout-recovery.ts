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
// Sent through the Hostinger mailbox (SMTP_HOST / SMTP_USER / SMTP_PASS, the
// same one lib/email/admin-notify.ts uses) so it never competes with the job
// alerts for Resend's monthly quota; falls back to Resend if SMTP isn't set.
// Needs the `recovery_email_sent_at` column (see supabase/schema.sql).
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/site-url";
import { buildUnsubscribeUrl, getOptedOutUserIds } from "@/lib/data/email-preference";
import { getPaidUserIds } from "@/lib/data/paid-users";
import { firstNameOf, getSender } from "@/lib/email/smtp-sender";
import { formatStudentCount } from "@/lib/student-count";
import { getSiteStats } from "@/lib/data/opportunities";
import {
  FULL_ACCESS_SALE_END_LABEL,
  FULL_ACCESS_SALE_ENDS_AT,
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
const MAX_USERS_PER_RUN = 40;
const WHATSAPP = "6363976632";

type Product = "full_access" | "internal_hr";

/** Real, live proof shared by every email in one run (no invented numbers). */
export type RecoveryContext = {
  liveOpenings: number;
  interviews: number;
  offers: number;
  /** Signed-up accounts, for the "2100+ students" proof line. */
  students: number;
  companies: string[];
  story?: { name: string; company: string; outcome: "interview" | "selected"; quote: string };
};

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
}

function daysLeftLabel(): string | undefined {
  const ms = new Date(FULL_ACCESS_SALE_ENDS_AT).getTime() - Date.now();
  if (ms <= 0) return undefined;
  const days = Math.floor(ms / 86_400_000);
  if (days >= 2) return `Only ${days} days left`;
  if (days === 1) return "Only 1 day left";
  return "Last day today";
}

function copyFor(product: Product, firstName: string) {
  const hi = firstName ? `${firstName}, y` : "Y";
  if (product === "internal_hr") {
    const price = getInternalPriceInr();
    const offer = isDiwaliOfferActive();
    return {
      subject: offer
        ? `${hi}our Internal HR access is still on hold — ₹${price} till ${FULL_ACCESS_SALE_END_LABEL}`
        : `${hi}our Internal HR access is still on hold`,
      preheader: "Openings shared directly by HRs + 6 Interview Question Kits. Finish in 30 seconds.",
      heading: "Your Internal HR access is still on hold",
      price,
      was: offer ? INTERNAL_SALE_MRP_INR : undefined,
      perDay: (price / 90).toFixed(1),
      offer,
      benefits: [
        ["Openings shared directly by HRs", "Low-competition roles most students never see."],
        ["Early access to fresh roles", "Apply before the crowd does."],
        ["6 Interview Question Kits (PDF)", "Walk into the interview prepared."],
        ["One payment, 3 months", "No auto-debit, no hidden charges."],
      ],
      cta: `Unlock Internal HR — ₹${price}`,
      path: "/internal-openings",
    };
  }
  const price = getFullAccessPriceInr();
  const offer = isFullAccessSaleActive();
  return {
    subject: offer
      ? `${hi}our ₹${price} Full Access is still waiting (ends ${FULL_ACCESS_SALE_END_LABEL})`
      : `${hi}our FirstOffer Full Access is still waiting`,
    preheader: "Direct HR emails, recruiter numbers & Google Forms on every opening. Finish in 30 seconds.",
    heading: "You were one tap away from applying directly to HRs",
    price,
    was: offer ? FULL_ACCESS_SALE_MRP_INR : undefined,
    perDay: (price / 90).toFixed(1),
    offer,
    benefits: [
      ["Direct HR emails & recruiter numbers", "Reach the person who shortlists — not a portal inbox."],
      ["Official Google Forms & apply links", "The company's own route on every opening."],
      ["New fresher jobs & internships daily", "Fresh roles only — each live for 48 hours."],
      ["Resume Keyword Matcher", "Check your fit before you apply."],
    ],
    cta: `Grab my ₹${price} access →`,
    path: "/unlock",
  };
}

export function renderHtml(
  product: Product,
  unsubscribeUrl: string,
  ctx: RecoveryContext,
  firstName = "",
): { subject: string; html: string } {
  const c = copyFor(product, firstName);
  const url = `${getSiteUrl()}${c.path}?utm_source=email&utm_medium=reminder&utm_campaign=checkout_recovery`;
  const wa = `https://wa.me/91${WHATSAPP}`;
  const left = c.offer ? daysLeftLabel() : undefined;
  const off = c.was ? Math.round((1 - c.price / c.was) * 100) : 0;

  const proof = [
    { v: formatStudentCount(ctx.students), l: "students" },
    ctx.interviews > 0 ? { v: String(ctx.interviews), l: "interview calls" } : null,
    ctx.offers > 0 ? { v: String(ctx.offers), l: "offers" } : null,
    ctx.liveOpenings > 0 ? { v: String(ctx.liveOpenings), l: "openings live now" } : null,
  ]
    .filter(Boolean)
    .slice(0, 3) as { v: string; l: string }[];
  const proofCells = proof
    .map(
      (p) =>
        `<td align="center" style="padding:12px 6px;background:#16161c;border-radius:12px;"><div style="font-size:22px;font-weight:800;color:#ffffff;">${esc(p.v)}</div><div style="font-size:12px;color:#a1a1aa;margin-top:2px;">${esc(p.l)}</div></td>`,
    )
    .join('<td style="width:8px;"></td>');

  const benefits = c.benefits
    .map(
      ([t, d]) =>
        `<tr><td style="padding:8px 12px 8px 0;vertical-align:top;width:22px;"><div style="width:22px;height:22px;border-radius:50%;background:#dcfce7;color:#15803d;font-size:13px;font-weight:800;text-align:center;line-height:22px;">✓</div></td><td style="padding:8px 0;"><div style="font-size:15px;font-weight:700;color:#111827;">${esc(t)}</div><div style="font-size:13.5px;color:#6b7280;margin-top:2px;">${esc(d)}</div></td></tr>`,
    )
    .join("");

  const companies = ctx.companies.length
    ? `<tr><td style="padding:22px 28px 0;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280;">FirstOffer students got interview calls from</p>
        <p style="margin:0;font-size:14px;line-height:2;color:#111827;">${ctx.companies
          .map((n) => `<span style="display:inline-block;margin:0 6px 6px 0;padding:3px 10px;border-radius:8px;background:#f3f4f6;border:1px solid #e5e7eb;font-weight:600;">${esc(n)}</span>`)
          .join("")}</p>
      </td></tr>`
    : "";

  const story = ctx.story
    ? `<tr><td style="padding:18px 28px 0;">
        <div style="padding:16px 18px;border-radius:14px;background:#f0fdf4;border:1px solid #bbf7d0;">
          <p style="margin:0;font-size:14.5px;line-height:1.6;color:#14532d;">${esc(ctx.story.quote)}</p>
          <p style="margin:8px 0 0;font-size:13px;font-weight:700;color:#166534;">— ${esc(ctx.story.name)}, ${ctx.story.outcome === "selected" ? "selected at" : "interview call from"} ${esc(ctx.story.company)}</p>
        </div>
      </td></tr>`
    : "";

  const priceBlock = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:16px;background:#0b0b10;">
      <tr><td style="padding:20px 22px;">
        ${c.offer ? `<span style="display:inline-block;padding:4px 12px;border-radius:999px;background:#3b2a07;border:1px solid #a16207;font-size:12.5px;font-weight:700;color:#fde68a;">🪔 Diwali offer · ends ${esc(FULL_ACCESS_SALE_END_LABEL)}${left ? ` · ${esc(left)}` : ""}</span>` : ""}
        <p style="margin:12px 0 0;font-size:40px;font-weight:800;color:#ffffff;line-height:1;">₹${c.price}
          ${c.was ? `<span style="font-size:20px;font-weight:600;color:#71717a;text-decoration:line-through;margin-left:8px;">₹${c.was}</span><span style="display:inline-block;vertical-align:middle;margin-left:8px;padding:3px 9px;border-radius:999px;background:#052e16;border:1px solid #166534;font-size:12px;font-weight:800;color:#4ade80;">${off}% OFF</span>` : ""}
        </p>
        <p style="margin:8px 0 0;font-size:14px;color:#a1a1aa;">for 3 months · that's just <b style="color:#ffffff;">₹${c.perDay}/day</b> — less than a cup of chai ☕</p>
        <a href="${url}" style="display:block;margin-top:16px;text-align:center;background:#2563eb;color:#ffffff;text-decoration:none;font-size:17px;font-weight:800;padding:16px 22px;border-radius:12px;">${esc(c.cta)}</a>
        <p style="margin:10px 0 0;text-align:center;font-size:12.5px;color:#a1a1aa;">🔒 Razorpay secure · UPI · GPay · PhonePe · Paytm · No auto-debit</p>
      </td></tr>
    </table>`;

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(c.preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:24px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr><td style="background:#0b0b10;padding:24px 28px 22px;">
            <p style="margin:0;font-size:19px;font-weight:800;color:#ffffff;">FirstOffer</p>
            <p style="margin:14px 0 0;font-size:24px;line-height:1.25;font-weight:800;color:#ffffff;">${esc(c.heading)}</p>
            <p style="margin:10px 0 0;font-size:15px;line-height:1.6;color:#d4d4d8;">
              ${firstName ? `Hi ${esc(firstName)}, y` : "Y"}our checkout didn't finish — happens all the time with UPI. Your offer price is still available, and it takes less than 30 seconds to complete.
            </p>
            ${proof.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;"><tr>${proofCells}</tr></table>` : ""}
          </td></tr>
          <tr><td style="padding:24px 28px 0;">
            <p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280;">What you unlock</p>
            <table role="presentation" cellpadding="0" cellspacing="0">${benefits}</table>
          </td></tr>
          ${companies}
          ${story}
          <tr><td style="padding:22px 28px 0;">${priceBlock}</td></tr>
          <tr><td style="padding:22px 28px 6px;">
            <p style="margin:0;font-size:14.5px;line-height:1.65;color:#374151;">
              Placements aren't only about skills — they're about your resume reaching a real HR. That's exactly what FirstOffer does, every single day.
            </p>
            <p style="margin:12px 0 0;font-size:14.5px;line-height:1.65;color:#374151;">
              Payment failed or money got deducted? Reply to this email or WhatsApp me at
              <a href="${wa}" style="color:#16a34a;font-weight:700;text-decoration:none;">+91 63639 76632</a> — I'll fix it the same day.
            </p>
            <p style="margin:14px 0 0;font-size:14.5px;color:#111827;font-weight:700;">— Nayan, Founder, FirstOffer</p>
          </td></tr>
          <tr><td style="padding:16px 28px 22px;">
            <a href="${url}" style="display:inline-block;color:#2563eb;font-size:15px;font-weight:700;text-decoration:none;">Complete my payment →</a>
          </td></tr>
          <tr><td style="padding:14px 28px 20px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af;">
              One-time reminder because you started a checkout on FirstOffer. Govt. registered MSME (Udyam).
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

async function loadContext(admin: ReturnType<typeof createAdminClient>): Promise<RecoveryContext> {
  const ctx: RecoveryContext = { liveOpenings: 0, interviews: 0, offers: 0, students: 0, companies: [] };
  try {
    const stats = await getSiteStats();
    ctx.liveOpenings = stats.totalOpportunities;
    ctx.interviews = stats.totalInterviews;
    ctx.offers = stats.totalOffers;
    ctx.students = stats.totalSubscribers;
  } catch (err) {
    console.error("Checkout reminders: stats failed:", err instanceof Error ? err.message : err);
  }
  const { data } = await admin
    .from("testimonials")
    .select("student_name, company_name, outcome, quote")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(150);
  const seen = new Set<string>();
  for (const t of data ?? []) {
    const name = String(t.company_name ?? "").trim();
    const key = name.toLowerCase();
    if (name && !seen.has(key) && ctx.companies.length < 18) {
      seen.add(key);
      ctx.companies.push(name);
    }
    const quote = String(t.quote ?? "").trim();
    if (!ctx.story && quote.length >= 30 && quote.length <= 260 && t.student_name) {
      ctx.story = {
        name: String(t.student_name).trim(),
        company: name,
        outcome: t.outcome === "selected" ? "selected" : "interview",
        quote,
      };
    }
  }
  return ctx;
}


/**
 * `maxAgeHours` defaults to 24 (the regular 10-minute run). A one-off
 * catch-up for older abandoned checkouts passes a larger value (max 14
 * days) via ?hours= on the cron route. Each call handles at most
 * MAX_USERS_PER_RUN students so it finishes well inside the time limit;
 * call again to continue (already-handled rows are skipped).
 */
export async function sendCheckoutRecoveryEmails(maxAgeHours: number = MAX_AGE_HOURS): Promise<{
  configured: boolean;
  candidates: number;
  sent: number;
  skipped: number;
  errors: number;
}> {
  const send = getSender("Nayan from FirstOffer");
  if (!send) {
    console.error("Checkout reminders aren't configured — set SMTP_HOST/SMTP_USER/SMTP_PASS (Hostinger) or RESEND_API_KEY/RESEND_FROM_EMAIL.");
    return { configured: false, candidates: 0, sent: 0, skipped: 0, errors: 0 };
  }
  const admin = createAdminClient();
  const now = Date.now();
  const newest = new Date(now - MIN_AGE_MINUTES * 60_000).toISOString();
  const hours = Math.min(Math.max(maxAgeHours, 1), 24 * 14);
  const oldest = new Date(now - hours * 3_600_000).toISOString();

  const { data: rows, error } = await admin
    .from("subscriptions")
    .select("id, user_id, product, created_at")
    .eq("status", "created")
    .neq("product", "career_kit") // reminder emails only cover the two memberships
    .is("recovery_email_sent_at", null)
    .lte("created_at", newest)
    .gte("created_at", oldest)
    .order("created_at", { ascending: false })
    .limit(500);
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

  if (byUser.size === 0) return { configured: true, candidates: 0, sent: 0, skipped: 0, errors: 0 };
  const optedOut = await getOptedOutUserIds(admin);
  const ctx = await loadContext(admin);
  const paidSets = await getPaidUserIds(admin);
  const cooldownSince = new Date(now - COOLDOWN_DAYS * 86_400_000).toISOString();
  let sent = 0;
  let skipped = 0;
  let errors = 0;

  let handled = 0;
  for (const [userId, { product, ids }] of byUser) {
    if (handled++ >= MAX_USERS_PER_RUN) break;
    // Mark first, so a slow or repeated run can never email twice.
    const markAll = () =>
      admin.from("subscriptions").update({ recovery_email_sent_at: new Date().toISOString() }).in("id", ids);

    const { count: recent } = await admin
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("recovery_email_sent_at", cooldownSince);
    // Service-role lookup: the cookie-based access helpers always say "no" in a cron.
    const paid = (product === "internal_hr" ? paidSets.internal : paidSets.fullAccess).has(userId);

    if (optedOut.has(userId) || paid || (recent ?? 0) > 0) {
      await markAll();
      skipped += 1;
      continue;
    }

    const { data: u } = await admin.auth.admin.getUserById(userId);
    const email = u?.user?.email;
    const firstName = firstNameOf(u?.user?.user_metadata);
    await markAll();
    if (!email) {
      skipped += 1;
      continue;
    }

    const unsubscribeUrl = buildUnsubscribeUrl(userId);
    const { subject, html } = renderHtml(product, unsubscribeUrl, ctx, firstName);
    const sendError = await send({
      to: email,
      subject,
      html,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    if (sendError) {
      console.error("Checkout reminder failed:", sendError);
      errors += 1;
    } else {
      sent += 1;
    }
    // Stay well under Hostinger's / Resend's per-second limits.
    await new Promise((r) => setTimeout(r, 600));
  }

  return { configured: true, candidates: byUser.size, sent, skipped, errors };
}
