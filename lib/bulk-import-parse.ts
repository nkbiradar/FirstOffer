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
  // Marks this as part of the ₹149/month "Internal HR Openings" product —
  // never set by parsing (regex or AI), only by the admin ticking the
  // per-item checkbox, or the "Mark all as Internal" batch action, in
  // BulkImportClient.tsx. Defaults to false so a normal paste never
  // accidentally hides itself from regular listings.
  isInternal: boolean;
  // Shows the "⚡ Immediate Hiring" badge — set only by the per-item checkbox.
  isImmediateHiring: boolean;
};

type FieldKey = Exclude<keyof BulkDraftOpportunity, "sourceText" | "isInternal" | "isImmediateHiring">;

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
  // "Experience: 0-3 years" is one of the most common lines in a
  // Telegram/WhatsApp posting, right after Location — and previously had
  // no recognized label at all. Per parseBlock()'s "unrecognized label
  // continues the previous field" behavior below, that meant it silently
  // got appended onto whatever field the line before it belonged to
  // (almost always location, since that's what usually comes right
  // before an experience line), producing broken values like
  // "Jaipur\nExperience: 0-3 years" that then rendered as one garbled
  // string wherever location is shown (see components/OpportunityCard.tsx).
  // Eligibility is the right home for it — it's already exactly "any
  // other eligibility criteria as free text", and it's rendered as its
  // own section on the opportunity detail page.
  experience: "eligibility",
  "experience required": "eligibility",
  "years of experience": "eligibility",
  exp: "eligibility",
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
    isInternal: false,
    isImmediateHiring: false,
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

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

// Indian mobile numbers: optional +91 / 91 / 0 prefix, then 10 digits starting
// 6–9, allowing a space or dash in the middle ("93822 44040", "+91-9382244040").
// Not preceded by a letter, digit, "/" or "=" so URL paths and query values
// (careers/job/4467197178...) are not mistaken for phone numbers.
const PHONE_RE = /(?<![\w/=.-])(?:\+91[\s-]?|91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}(?!\d)/g;

/** A phone-looking number that is really a job/requisition ID ("Job ID: 9876543210"). */
function isIdNumber(text: string, index: number): boolean {
  return /\b(?:job|req|requisition|ref|reference)?\s*(?:id|no\.?|number|#)\s*[:#-]?\s*$/i.test(
    text.slice(Math.max(0, index - 25), index),
  );
}

function findPhones(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(PHONE_RE)) {
    if (m.index !== undefined && !isIdNumber(text, m.index)) out.push(m[0].trim());
  }
  return out;
}

/**
 * Keeps HR contact details out of Additional Details: any sentence there that
 * contains an email address or a phone number is dropped (e.g. "Interested
 * candidates can send their resume to hr@x.com." / "Share your resume with
 * Lavanya HR at 9382244040."). The first email found fills hrEmail and the
 * first phone number fills hrContact if they're still empty — so the admin
 * never has to delete them by hand.
 */
export function moveContactsOutOfDetails(draft: BulkDraftOpportunity): BulkDraftOpportunity {
  const text = draft.additionalDetails;
  const emails = text.match(EMAIL_RE) ?? [];
  const phones = findPhones(text);
  if (emails.length === 0 && phones.length === 0) return draft;
  const hasContact = (sentence: string) =>
    new RegExp(EMAIL_RE.source).test(sentence) || findPhones(sentence).length > 0;
  const cleaned = text
    .split("\n")
    .map((line) =>
      line
        .split(/(?<=[.!?])\s+/)
        .filter((sentence) => !hasContact(sentence))
        .join(" ")
        .trim(),
    )
    .filter(Boolean)
    .join("\n");
  return {
    ...draft,
    additionalDetails: cleaned,
    hrEmail: draft.hrEmail.trim() || emails[0] || "",
    hrContact: draft.hrContact.trim() || phones[0] || "",
  };
}

/** @deprecated kept for existing imports — now also moves phone numbers. */
export const moveEmailsOutOfDetails = moveContactsOutOfDetails;

type StringFieldKey = Exclude<keyof BulkDraftOpportunity, "isInternal" | "isImmediateHiring">;

function finalizeDraft(draft: BulkDraftOpportunity): BulkDraftOpportunity {
  const trimmed = { ...draft };
  // isInternal is a boolean, not a string — every other field here is
  // string-typed, so it's filtered out (at runtime, not just the type
  // cast) before the generic trim loop below.
  const stringKeys = (Object.keys(trimmed) as (keyof BulkDraftOpportunity)[]).filter(
    (key): key is StringFieldKey => key !== "isInternal" && key !== "isImmediateHiring",
  );
  for (const key of stringKeys) {
    trimmed[key] = trimmed[key].trim();
  }
  trimmed.opportunityType = normalizeType(trimmed.opportunityType);
  trimmed.workMode = normalizeWorkMode(trimmed.workMode);
  return moveContactsOutOfDetails(trimmed);
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
