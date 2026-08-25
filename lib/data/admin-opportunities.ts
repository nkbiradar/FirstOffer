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

function validate(input: OpportunityFormInput) {
  const errors: string[] = [];
  if (!input.role.trim()) errors.push("Role is required.");
  if (!input.sourceText.trim()) errors.push("Original Telegram message is required.");
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
  | "deadline"
  | "source_text"
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
    deadline: input.deadline || null,
    source_text: input.sourceText.trim(),
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
): Promise<Opportunity> {
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
  // about "putting it back up."
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
  return data as Opportunity;
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

/** yyyy-mm-dd in IST — the site's opportunities are India-focused (₹, Bengaluru, etc.), so "today" is judged in IST rather than UTC. */
function istDateKey(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

/** Simple counts for the /admin dashboard — no analytics, just the four numbers the spec asks for. */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  await sweepExpiredOpportunities();

  const admin = createAdminClient();
  const { data, error } = await admin.from("opportunities").select("status, published_at");

  if (error) {
    console.error("getAdminDashboardStats failed:", error.message);
    return { total: 0, todayPublished: 0, drafts: 0, expired: 0 };
  }

  const rows = (data ?? []) as { status: OpportunityStatus; published_at: string | null }[];
  const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  return {
    total: rows.length,
    todayPublished: rows.filter(
      (row) => row.status === "published" && row.published_at && istDateKey(row.published_at) === todayKey,
    ).length,
    drafts: rows.filter((row) => row.status === "draft").length,
    expired: rows.filter((row) => row.status === "expired").length,
  };
}
