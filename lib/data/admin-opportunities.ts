// Admin-side opportunity reads/writes. Always uses the service-role client
// (see lib/supabase/admin.ts) since RLS only grants public SELECT of
// published, non-expired rows — admins need to see and change everything.
// Callers (API routes) are responsible for checking getAdminUser() first.

import { createAdminClient } from "@/lib/supabase/admin";
import { findOrCreateCompanyId } from "@/lib/data/companies";
import type { Opportunity, OpportunityInsert, OpportunityStatus } from "@/types/supabase";
import type { OpportunityWithCompany } from "@/lib/data/opportunities";
import type { OpportunityFormInput } from "@/lib/data/opportunity-form-data";

const OPPORTUNITY_SELECT = "*, company:companies(id, name, slug, logo_url)";

export class OpportunityValidationError extends Error {}

// Email addresses, plain and simple.
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

// Indian mobile numbers, in whatever spacing/punctuation someone pastes
// them with ("+91 90565-22777", "90565 22777", "9056522777", ...). Phone
// numbers show up split unpredictably, so this first grabs any run of
// digits-with-separators that STARTS like a mobile number (6-9, optionally
// preceded by +91), then strips every non-digit and checks the result is
// exactly 10 digits (or 12 with a 91 prefix) -- that length check is what
// keeps this from false-positiving on ordinary eligibility text like
// "1-2 years experience" or "stipend 15000-20000", which never reduce to
// a 10/12-digit run.
function containsIndianPhoneNumber(text: string): boolean {
  const candidates = text.match(/(?:\+?91[\s.-]?)?[6-9][\d\s.-]{7,13}\d/g) ?? [];
  return candidates.some((candidate) => {
    const digits = candidate.replace(/\D/g, "");
    return digits.length === 10 || (digits.length === 12 && digits.startsWith("91"));
  });
}

// Fields that render on the public opportunity page with NO paywall check
// (see app/opportunities/[id]/page.tsx -- eligibility/responsibilities/
// requirements/additional_details all render unconditionally, unlike
// hr_email/hr_contact/how_to_apply/application_url/google_form_url, which
// are properly gated behind canShowApply). A phone number or email pasted
// into any of these leaks for free to every visitor, paid or not -- this
// is exactly the bug found in additional_details on 2026-09-24 (a WhatsApp
// number sitting in "Additional Details", fully public). Checked here,
// once, so neither the single-add form nor Bulk Import (both funnel
// through createOpportunity() below) can reintroduce it.
function findLeakedContactInfo(input: OpportunityFormInput): string | null {
  const fieldsToCheck: [string, string][] = [
    ["Eligibility", input.eligibility],
    ["Additional Details", input.additionalDetails],
    ["Responsibilities", input.responsibilities.join(" ")],
    ["Requirements", input.requirements.join(" ")],
  ];
  for (const [label, text] of fieldsToCheck) {
    if (!text) continue;
    if (containsIndianPhoneNumber(text) || EMAIL_PATTERN.test(text)) {
      return label;
    }
  }
  return null;
}

function validate(input: OpportunityFormInput) {
  const errors: string[] = [];
  if (!input.role.trim()) errors.push("Role is required.");
  if (!input.sourceText.trim()) errors.push("Original Telegram message is required.");

  const leakField = findLeakedContactInfo(input);
  if (leakField) {
    errors.push(
      `"${leakField}" looks like it contains a phone number or email address. That field is shown to every visitor for free, even before payment -- move contact info to HR Email or HR Contact instead (those are locked behind the paid unlock).`,
    );
  }

  if (errors.length > 0) throw new OpportunityValidationError(errors.join(" "));
}

/**
 * The form's "Company" field is either an existing company picked from a
 * dropdown (companyId) or a new company's name typed into a text input
 * (newCompanyName) — never both meaningfully filled at once. This resolves
 * either shape to a concrete company id, creating the company if needed.
 * When a new company is being created, an optional logo URL typed
 * alongside the name is passed through so it's set at creation time.
 */
async function resolveCompanyId(input: OpportunityFormInput): Promise<string> {
  if (input.companyId.trim()) return input.companyId.trim();
  if (input.newCompanyName.trim()) {
    return findOrCreateCompanyId(input.newCompanyName, input.newCompanyLogoUrl);
  }
  throw new OpportunityValidationError(
    "Select an existing company or enter a new company name.",
  );
}

type OpportunityDbFields = Pick<
  OpportunityInsert,
  | "role"
  | "opportunity_type"
  | "batch"
  | "degree"
  | "branches"
  | "stipend"
  | "salary"
  | "location"
  | "work_mode"
  | "skills"
  | "responsibilities"
  | "requirements"
  | "eligibility"
  | "additional_details"
  | "application_url"
  | "google_form_url"
  | "hr_email"
  | "hr_contact"
  | "how_to_apply"
  | "premium_group_hint"
  | "deadline"
  | "source_text"
  | "is_internal"
>;

function toDbFields(input: OpportunityFormInput): OpportunityDbFields {
  return {
    role: input.role.trim(),
    opportunity_type: input.opportunityType || null,
    batch: input.batch,
    degree: input.degree,
    branches: input.branches,
    stipend: input.stipend.trim() || null,
    salary: input.salary.trim() || null,
    location: input.location.trim() || null,
    work_mode: input.workMode || null,
    skills: input.skills,
    responsibilities: input.responsibilities,
    requirements: input.requirements,
    eligibility: input.eligibility.trim() || null,
    additional_details: input.additionalDetails.trim() || null,
    application_url: input.applicationUrl.trim() || null,
    google_form_url: input.googleFormUrl.trim() || null,
    hr_email: input.hrEmail.trim() || null,
    hr_contact: input.hrContact.trim() || null,
    how_to_apply: input.howToApply.trim() || null,
    premium_group_hint: input.premiumGroupHint.trim() || null,
    deadline: input.deadline || null,
    source_text: input.sourceText.trim(),
    is_internal: input.isInternal,
  };
}

// ── Auto-expiry ──────────────────────────────────────────────────────────

/** Every opportunity is only shown for this long after it's first published, regardless of its own `deadline`. */
const LISTING_VISIBILITY_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

/** yyyy-mm-dd in IST — matches how `deadline` is entered/compared elsewhere. */
function todayDateKey() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

/**
 * Lazily flips any `published` opportunity to `status = "expired"` once
 * either of two independent clocks runs out:
 *  - `deadline` (date, admin-entered — the job's own application deadline)
 *    has passed, or
 *  - `expires_at` (timestamp, set automatically to `published_at` + 2 days
 *    by createOpportunity()/updateOpportunity() below) has passed — the
 *    site's own "don't show anything older than 2 days" freshness policy,
 *    which applies even if `deadline` is further out or unset.
 * There's no cron/scheduled job in this project, so this runs inline
 * whenever an admin loads a page that needs an accurate picture (the
 * opportunities list, the dashboard stats) — cheap (two indexed updates)
 * and idempotent. The public site already hides these via
 * applyPublishedFilter() in lib/data/opportunities.ts (which checks both
 * columns) regardless of whether this sweep has run yet; this just makes
 * the stored `status` catch up so admin views (and the "Expired" tab/count)
 * are correct too.
 */
async function sweepExpiredOpportunities(): Promise<void> {
  const admin = createAdminClient();

  const { error: deadlineError } = await admin
    .from("opportunities")
    .update({ status: "expired" })
    .eq("status", "published")
    .not("deadline", "is", null)
    .lt("deadline", todayDateKey());

  if (deadlineError) {
    console.error("sweepExpiredOpportunities (deadline) failed:", deadlineError.message);
  }

  const { error: expiresAtError } = await admin
    .from("opportunities")
    .update({ status: "expired" })
    .eq("status", "published")
    .not("expires_at", "is", null)
    .lt("expires_at", new Date().toISOString());

  if (expiresAtError) {
    console.error("sweepExpiredOpportunities (expires_at) failed:", expiresAtError.message);
  }
}

/** All opportunities (any status), newest first — for the admin list, with an optional status tab filter. */
export async function getOpportunitiesForAdmin(
  status?: OpportunityStatus,
): Promise<OpportunityWithCompany[]> {
  await sweepExpiredOpportunities();

  const admin = createAdminClient();
  let query = admin
    .from("opportunities")
    .select(OPPORTUNITY_SELECT)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getOpportunitiesForAdmin failed:", error.message);
    return [];
  }
  return (data ?? []) as OpportunityWithCompany[];
}

/** A single opportunity by id, any status — for the admin edit page. */
export async function getOpportunityByIdForAdmin(
  id: string,
): Promise<OpportunityWithCompany | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("opportunities")
    .select(OPPORTUNITY_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getOpportunityByIdForAdmin failed:", error.message);
    return null;
  }
  return data as OpportunityWithCompany | null;
}

export async function createOpportunity(input: OpportunityFormInput): Promise<Opportunity> {
  validate(input);
  const companyId = await resolveCompanyId(input);
  const admin = createAdminClient();

  const publishedAt = input.status === "published" ? new Date() : null;

  const payload: OpportunityInsert = {
    ...toDbFields(input),
    company_id: companyId,
    status: input.status,
    published_at: publishedAt ? publishedAt.toISOString() : null,
    // 2-day listing-visibility window, starting the moment this goes live —
    // see the LISTING_VISIBILITY_MS note above sweepExpiredOpportunities().
    expires_at: publishedAt ? new Date(publishedAt.getTime() + LISTING_VISIBILITY_MS).toISOString() : null,
  };

  const { data, error } = await admin.from("opportunities").insert(payload).select("*").single();
  if (error) throw new Error(`Create failed: ${error.message}`);
  return data as Opportunity;
}

export async function updateOpportunity(
  id: string,
  input: OpportunityFormInput,
): Promise<{ opportunity: Opportunity; publishingNow: boolean }> {
  validate(input);

  const existing = await getOpportunityByIdForAdmin(id);
  if (!existing) throw new Error("Opportunity not found.");

  const companyId = await resolveCompanyId(input);
  const admin = createAdminClient();

  // Only stamp published_at the first time an opportunity becomes published —
  // an edit that keeps it published, or that unpublishes/republishes it,
  // shouldn't keep resetting when it was "originally" published. A genuine
  // re-publish (draft/expired -> published again) does reset both
  // published_at and expires_at, restarting the 2-day visibility window —
  // same as a brand-new upload, which matches how the admin would think
  // about "putting it back up." Also the signal the caller uses to decide
  // whether to fire a "new opportunity" push notification — an edit that
  // was already published shouldn't re-notify.
  const publishingNow = input.status === "published" && existing.status !== "published";

  const payload: Partial<OpportunityInsert> = {
    ...toDbFields(input),
    company_id: companyId,
    status: input.status,
  };
  if (publishingNow) {
    const publishedAt = new Date();
    payload.published_at = publishedAt.toISOString();
    payload.expires_at = new Date(publishedAt.getTime() + LISTING_VISIBILITY_MS).toISOString();
  }

  const { data, error } = await admin
    .from("opportunities")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(`Update failed: ${error.message}`);
  return { opportunity: data as Opportunity, publishingNow };
}

export async function deleteOpportunity(id: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("opportunities").delete().eq("id", id);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}

// ── Admin dashboard stats ────────────────────────────────────────────────

export type AdminDashboardStats = {
  total: number;
  todayPublished: number;
  drafts: number;
  expired: number;
};

/**
 * Simple counts for the /admin dashboard — no analytics, just the four
 * numbers the spec asks for.
 *
 * NOTE: this used to `.select("status, published_at")` with no `.limit()`
 * and count client-side in JS. That worked fine while the table had under
 * 1000 rows, but Supabase/PostgREST caps an unlimited select at 1000 rows
 * by default — once the table passed that (Sep 2026), the query silently
 * returned only a 1000-row slice (oldest rows, since there's no explicit
 * `.order()`), so `total`/`expired` read as a stuck "1000" and freshly
 * published rows — which never made it into that truncated slice — never
 * counted toward `todayPublished`. Using `{ count: "exact", head: true }`
 * per status makes Postgres do the counting server-side instead, so this
 * is correct (and cheaper) no matter how large the table gets.
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  await sweepExpiredOpportunities();

  const admin = createAdminClient();

  // IST day boundaries, expressed with an explicit +05:30 offset so
  // Postgres compares them against `published_at` (timestamptz) correctly
  // regardless of the server's own timezone.
  const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const todayStartIso = `${todayKey}T00:00:00.000+05:30`;
  const todayEndIso = `${todayKey}T23:59:59.999+05:30`;

  const [totalRes, todayPublishedRes, draftsRes, expiredRes] = await Promise.all([
    admin.from("opportunities").select("*", { count: "exact", head: true }),
    admin
      .from("opportunities")
      .select("*", { count: "exact", head: true })
      .eq("status", "published")
      .gte("published_at", todayStartIso)
      .lte("published_at", todayEndIso),
    admin.from("opportunities").select("*", { count: "exact", head: true }).eq("status", "draft"),
    admin.from("opportunities").select("*", { count: "exact", head: true }).eq("status", "expired"),
  ]);

  const firstError = [totalRes.error, todayPublishedRes.error, draftsRes.error, expiredRes.error].find(
    (error) => error != null,
  );
  if (firstError) {
    console.error("getAdminDashboardStats failed:", firstError.message);
    return { total: 0, todayPublished: 0, drafts: 0, expired: 0 };
  }

  return {
    total: totalRes.count ?? 0,
    todayPublished: todayPublishedRes.count ?? 0,
    drafts: draftsRes.count ?? 0,
    expired: expiredRes.count ?? 0,
  };
}
