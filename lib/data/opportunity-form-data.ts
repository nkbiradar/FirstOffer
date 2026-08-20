// Parses the admin opportunity form's FormData into a typed shape.
// The form itself is a plain HTML <form method="post">, kept dependency-free
// (no client JS, no schema-validation library) per the "keep it basic"
// instruction — required-field validation lives in lib/data/admin-opportunities.ts.

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
function parseList(raw: string): string[] {
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/** One-bullet-per-line textareas: responsibilities, requirements. */
function parseLines(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseEnum<T extends string>(value: string, valid: readonly T[]): T | "" {
  return (valid as readonly string[]).includes(value) ? (value as T) : "";
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
    role: str(formData, "role"),
    opportunityType: parseEnum(str(formData, "opportunity_type"), VALID_TYPES),
    batch: parseList(str(formData, "batch")),
    stipend: str(formData, "stipend"),
    salary: str(formData, "salary"),
    location: str(formData, "location"),
    workMode: parseEnum(str(formData, "work_mode"), VALID_MODES),
    degree: parseList(str(formData, "degree")),
    branches: parseList(str(formData, "branches")),
    eligibility: str(formData, "eligibility"),
    skills: parseList(str(formData, "skills")),
    responsibilities: parseLines(str(formData, "responsibilities")),
    requirements: parseLines(str(formData, "requirements")),
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
