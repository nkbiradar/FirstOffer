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
 */
async function resolveCompanyId(input: OpportunityFormInput): Promise<string> {
  if (input.companyId.trim()) return input.companyId.trim();
  if (input.newCompanyName.trim()) return findOrCreateCompanyId(input.newCompanyName);
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

/** All opportunities (any status), newest first — for the admin list, with an optional status tab filter. */
export async function getOpportunitiesForAdmin(
  status?: OpportunityStatus,
): Promise<OpportunityWithCompany[]> {
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

  const payload: OpportunityInsert = {
    ...toDbFields(input),
    company_id: companyId,
    status: input.status,
    published_at: input.status === "published" ? new Date().toISOString() : null,
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
  // shouldn't keep resetting when it was "originally" published.
  const publishingNow = input.status === "published" && existing.status !== "published";

  const payload: Partial<OpportunityInsert> = {
    ...toDbFields(input),
    company_id: companyId,
    status: input.status,
  };
  if (publishingNow) {
    payload.published_at = new Date().toISOString();
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
