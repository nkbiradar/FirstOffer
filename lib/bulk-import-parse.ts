// Pure text-parsing for the bulk import flow (/admin/opportunities/import).
// No server/client-only APIs used here, so this same module runs both in
// the browser (BulkImportClient's "Parse Opportunities" button) and, if
// ever needed server-side, in a Route Handler — it's just string parsing.

export type BulkDraftOpportunity = {
  company: string;
  role: string;
  opportunityType: string; // "internship" | "full_time" | ""
  batch: string; // comma-separated, e.g. "2025, 2026"
  degree: string;
  branches: string;
  stipend: string;
  salary: string;
  location: string;
  workMode: string; // "remote" | "hybrid" | "onsite" | ""
  skills: string; // comma-separated
  responsibilities: string; // one per line
  requirements: string; // one per line
  eligibility: string;
  additionalDetails: string;
  applicationUrl: string;
  googleFormUrl: string;
  hrEmail: string;
  hrContact: string;
  howToApply: string;
  deadline: string; // yyyy-mm-dd or ""
  sourceText: string; // the raw pasted block — captured automatically, never edited
};

type FieldKey = Exclude<keyof BulkDraftOpportunity, "sourceText">;

// Recognized "Label:" lines, case-insensitive. Several aliases per field
// since the exact wording out of ChatGPT will vary paste to paste.
const FIELD_ALIASES: Record<string, FieldKey> = {
  company: "company",
  "company name": "company",
  role: "role",
  position: "role",
  type: "opportunityType",
  "opportunity type": "opportunityType",
  batch: "batch",
  "eligible batch": "batch",
  degree: "degree",
  branch: "branches",
  branches: "branches",
  stipend: "stipend",
  ctc: "salary",
  salary: "salary",
  "salary / ctc": "salary",
  "ctc / salary": "salary",
  location: "location",
  "work mode": "workMode",
  mode: "workMode",
  skills: "skills",
  "skills required": "skills",
  responsibilities: "responsibilities",
  requirements: "requirements",
  eligibility: "eligibility",
  "additional details": "additionalDetails",
  "additional info": "additionalDetails",
  "application url": "applicationUrl",
  "application link": "applicationUrl",
  "google form": "googleFormUrl",
  "google form url": "googleFormUrl",
  "hr email": "hrEmail",
  email: "hrEmail",
  "hr contact": "hrContact",
  "hr phone": "hrContact",
  contact: "hrContact",
  "how to apply": "howToApply",
  deadline: "deadline",
  "last date": "deadline",
};

export function normalizeType(raw: string): string {
  const value = raw.trim().toLowerCase();
  if (value === "internship" || value === "intern") return "internship";
  if (["full-time", "full time", "fulltime", "full_time"].includes(value)) return "full_time";
  return "";
}

export function normalizeWorkMode(raw: string): string {
  const value = raw.trim().toLowerCase();
  if (value === "remote") return "remote";
  if (value === "hybrid") return "hybrid";
  if (["onsite", "on-site", "on site", "office", "work from office", "wfo"].includes(value)) return "onsite";
  return "";
}

function emptyDraft(sourceText: string): BulkDraftOpportunity {
  return {
    company: "",
    role: "",
    opportunityType: "",
    batch: "",
    degree: "",
    branches: "",
    stipend: "",
    salary: "",
    location: "",
    workMode: "",
    skills: "",
    responsibilities: "",
    requirements: "",
    eligibility: "",
    additionalDetails: "",
    applicationUrl: "",
    googleFormUrl: "",
    hrEmail: "",
    hrContact: "",
    howToApply: "",
    deadline: "",
    sourceText,
  };
}

/**
 * Splits pasted text into individual opportunity chunks.
 *
 * Primary format: one or more `---OPPORTUNITY--- ... ---END---` blocks (the
 * `---END---` is optional — a new `---OPPORTUNITY---` or end-of-text also
 * closes a block). If no `---OPPORTUNITY---` marker is present at all
 * (someone pasted a single opportunity, or used a different separator),
 * falls back to splitting on 2+ blank lines so a single paste doesn't just
 * silently produce zero results.
 */
function extractBlocks(raw: string): string[] {
  const text = raw.replace(/\r\n/g, "\n");

  if (!text.includes("---OPPORTUNITY---")) {
    return text
      .split(/\n{2,}/)
      .map((chunk) => chunk.trim())
      .filter(Boolean);
  }

  const blocks: string[] = [];
  const regex = /---OPPORTUNITY---([\s\S]*?)(?=---OPPORTUNITY---|$)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const body = match[1].replace(/---END---/g, "").trim();
    if (body) blocks.push(body);
  }
  return blocks;
}

function finalizeDraft(draft: BulkDraftOpportunity): BulkDraftOpportunity {
  const trimmed = { ...draft };
  for (const key of Object.keys(trimmed) as (keyof BulkDraftOpportunity)[]) {
    trimmed[key] = trimmed[key].trim();
  }
  trimmed.opportunityType = normalizeType(trimmed.opportunityType);
  trimmed.workMode = normalizeWorkMode(trimmed.workMode);
  return trimmed;
}

/**
 * Parses one block's `Label: value` lines. A line that doesn't match a
 * recognized label continues the previous field's value (so multi-line
 * Responsibilities / Additional Details / How to Apply bodies work even
 * though the documented format only shows single-line fields). Text before
 * the first recognized label, or an unrecognized label, is simply not
 * attributed to any field — it's still preserved in sourceText, which is
 * always the full original block, so nothing is ever lost, only possibly
 * left for the admin to copy into a field by hand while reviewing.
 */
function parseBlock(block: string): BulkDraftOpportunity {
  const draft = emptyDraft(block);
  const lines = block.split("\n");
  let currentKey: FieldKey | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const labelMatch = line.match(/^\s*([A-Za-z][A-Za-z /]{0,30}?)\s*:\s?(.*)$/);
    const label = labelMatch?.[1]?.trim().toLowerCase();
    const field = label ? FIELD_ALIASES[label] : undefined;

    if (labelMatch && field) {
      currentKey = field;
      const value = labelMatch[2].trim();
      draft[field] = draft[field] ? `${draft[field]}\n${value}` : value;
      continue;
    }

    if (currentKey && line.trim()) {
      draft[currentKey] = draft[currentKey] ? `${draft[currentKey]}\n${line.trim()}` : line.trim();
    }
  }

  return finalizeDraft(draft);
}

export function parseBulkOpportunities(raw: string): BulkDraftOpportunity[] {
  return extractBlocks(raw).map(parseBlock);
}
