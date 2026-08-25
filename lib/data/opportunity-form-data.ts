// Parses the admin opportunity form's FormData into a typed shape.
// The single-opportunity form is a plain HTML <form method="post">, kept
// dependency-free (no client JS, no schema-validation library) per the
// "keep it basic" instruction. The bulk-import flow (lib/bulk-import-parse.ts
// + app/api/admin/opportunities/bulk/route.ts) reuses the same list/line/enum
// parsing helpers exported here, just fed from plain strings instead of a
// FormData field — required-field validation lives in
// lib/data/admin-opportunities.ts either way.

import type { OpportunityStatus, OpportunityType, WorkMode } from "@/types/supabase";

export const VALID_TYPES: readonly OpportunityType[] = ["internship", "full_time"];
export const VALID_MODES: readonly WorkMode[] = ["remote", "hybrid", "onsite"];
export const VALID_STATUSES: readonly OpportunityStatus[] = ["draft", "published", "expired"];

export type OpportunityFormInput = {
  // Company is either an existing company's id (dropdown) or a new
  // company's name (text input) — never both filled meaningfully at once.
  // See resolveCompanyId() in lib/data/admin-opportunities.ts.
  companyId: string;
  newCompanyName: string;
  // Only used when newCompanyName is filled — an optional logo URL for the
  // brand-new company being created. Ignored when companyId is set (an
  // existing company's logo is edited from /admin/companies instead).
  newCompanyLogoUrl: string;
  role: string;
  opportunityType: OpportunityType | "";
  batch: string[];
  stipend: string;
  salary: string;
  location: string;
  workMode: WorkMode | "";
  degree: string[];
  branches: string[];
  eligibility: string;
  skills: string[];
  responsibilities: string[];
  requirements: string[];
  additionalDetails: string;
  applicationUrl: string;
  googleFormUrl: string;
  hrEmail: string;
  hrContact: string;
  howToApply: string;
  deadline: string;
  sourceText: string;
  status: OpportunityStatus;
};

export function str(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Comma-separated multi-value fields: batch, degree, branches, skills. */
export function parseListValue(raw: string): string[] {
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/** One-bullet-per-line textareas: responsibilities, requirements. Also
 * strips a leading "- " or "* " bullet marker, since bulk-pasted text
 * (via ChatGPT, etc.) commonly uses one. */
export function parseLinesValue(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.trim().replace(/^[-*]\s+/, ""))
    .filter(Boolean);
}

export function parseEnumValue<T extends string>(value: string, valid: readonly T[]): T | "" {
  const normalized = value.trim();
  return (valid as readonly string[]).includes(normalized) ? (normalized as T) : "";
}

/**
 * `status` is passed in explicitly rather than read from the form: the
 * "Add Opportunity" form has two submit buttons (Save Draft / Publish,
 * distinguished by `name="intent"`) instead of a status field, while the
 * edit form has an actual status <select>. The route handlers work out the
 * right value for each case and hand it to this function.
 */
export function parseOpportunityFormData(
  formData: FormData,
  status: OpportunityStatus,
): OpportunityFormInput {
  return {
    companyId: str(formData, "company_id"),
    newCompanyName: str(formData, "new_company_name"),
    newCompanyLogoUrl: str(formData, "new_company_logo_url"),
    role: str(formData, "role"),
    opportunityType: parseEnumValue(str(formData, "opportunity_type"), VALID_TYPES),
    batch: parseListValue(str(formData, "batch")),
    stipend: str(formData, "stipend"),
    salary: str(formData, "salary"),
    location: str(formData, "location"),
    workMode: parseEnumValue(str(formData, "work_mode"), VALID_MODES),
    degree: parseListValue(str(formData, "degree")),
    branches: parseListValue(str(formData, "branches")),
    eligibility: str(formData, "eligibility"),
    skills: parseListValue(str(formData, "skills")),
    responsibilities: parseLinesValue(str(formData, "responsibilities")),
    requirements: parseLinesValue(str(formData, "requirements")),
    additionalDetails: str(formData, "additional_details"),
    applicationUrl: str(formData, "application_url"),
    googleFormUrl: str(formData, "google_form_url"),
    hrEmail: str(formData, "hr_email"),
    hrContact: str(formData, "hr_contact"),
    howToApply: str(formData, "how_to_apply"),
    deadline: str(formData, "deadline"),
    sourceText: str(formData, "source_text"),
    status,
  };
}


// ── Bulk import ──────────────────────────────────────────────────────────
// Shape sent by the browser from /admin/opportunities/import (see
// lib/bulk-import-parse.ts for how raw pasted text becomes this shape) —
// plain strings throughout, since that's what's editable in the preview
// UI. Converts to the same OpportunityFormInput that the single-opportunity
// form produces, reusing the exact same list/line/enum parsing.
export type BulkOpportunityItem = {
  company: string;
  role: string;
  opportunityType: string;
  batch: string;
  degree: string;
  branches: string;
  stipend: string;
  salary: string;
  location: string;
  workMode: string;
  skills: string;
  responsibilities: string;
  requirements: string;
  eligibility: string;
  additionalDetails: string;
  applicationUrl: string;
  googleFormUrl: string;
  hrEmail: string;
  hrContact: string;
  howToApply: string;
  deadline: string;
  sourceText: string;
  status: string;
};

export function parseOpportunityBulkItem(item: BulkOpportunityItem): OpportunityFormInput {
  return {
    companyId: "",
    newCompanyName: item.company.trim(),
    newCompanyLogoUrl: "",
    role: item.role.trim(),
    opportunityType: parseEnumValue(item.opportunityType ?? "", VALID_TYPES),
    batch: parseListValue(item.batch ?? ""),
    stipend: (item.stipend ?? "").trim(),
    salary: (item.salary ?? "").trim(),
    location: (item.location ?? "").trim(),
    workMode: parseEnumValue(item.workMode ?? "", VALID_MODES),
    degree: parseListValue(item.degree ?? ""),
    branches: parseListValue(item.branches ?? ""),
    eligibility: (item.eligibility ?? "").trim(),
    skills: parseListValue(item.skills ?? ""),
    responsibilities: parseLinesValue(item.responsibilities ?? ""),
    requirements: parseLinesValue(item.requirements ?? ""),
    additionalDetails: (item.additionalDetails ?? "").trim(),
    applicationUrl: (item.applicationUrl ?? "").trim(),
    googleFormUrl: (item.googleFormUrl ?? "").trim(),
    hrEmail: (item.hrEmail ?? "").trim(),
    hrContact: (item.hrContact ?? "").trim(),
    howToApply: (item.howToApply ?? "").trim(),
    deadline: (item.deadline ?? "").trim(),
    sourceText: (item.sourceText ?? "").trim(),
    status: parseEnumValue(item.status ?? "", VALID_STATUSES) || "draft",
  };
}
