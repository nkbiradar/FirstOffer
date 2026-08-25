// AI-assisted structured extraction for the bulk import "Parse with AI"
// button. This is a fallback/upgrade to the existing regex-based
// lib/bulk-import-parse.ts — that parser still runs first and still works
// with zero setup; this module only gets used when the admin explicitly
// clicks "Parse with AI" (e.g. on messages that don't use the
// `---OPPORTUNITY---` / `Label: value` format the regex parser expects).
//
// Requires ANTHROPIC_API_KEY (see the placeholder added to .env.local — the
// admin needs to fill in a real key from console.anthropic.com before this
// works; until then extractOpportunitiesWithAi() returns a clear error that
// the "Parse with AI" button surfaces instead of failing silently).

import Anthropic from "@anthropic-ai/sdk";
import { normalizeType, normalizeWorkMode, type BulkDraftOpportunity } from "@/lib/bulk-import-parse";

const FIELD_DESCRIPTIONS = `
- company: the hiring company's name
- role: the job/internship title
- opportunityType: "internship", "full_time", or "" if unclear
- batch: eligible graduation years, comma-separated (e.g. "2025, 2026")
- degree: eligible degrees, comma-separated (e.g. "B.Tech, BCA")
- branches: eligible branches, comma-separated (e.g. "CSE, IT, ECE")
- stipend: stipend text, free-form (internships)
- salary: salary/CTC text, free-form (full-time roles)
- location: work location
- workMode: "remote", "hybrid", "onsite", or "" if unclear
- skills: required skills, comma-separated
- responsibilities: one responsibility per line
- requirements: one requirement per line
- eligibility: any other eligibility criteria as free text
- additionalDetails: anything else worth keeping that doesn't fit elsewhere
- applicationUrl: direct application link, if any
- googleFormUrl: Google Form link, if any
- hrEmail: HR/contact email, if any
- hrContact: HR/contact phone number, if any
- howToApply: application instructions, verbatim
- deadline: application deadline as yyyy-mm-dd, or "" if not stated
- sourceText: the exact original text of just this one posting (verbatim, unmodified, unsummarized)
`.trim();

const SYSTEM_PROMPT = `You extract structured job/internship opportunity postings from raw pasted text (usually forwarded Telegram/WhatsApp messages, sometimes containing multiple postings in one paste).

Return ONLY a JSON array (no markdown fences, no commentary) where each element is one opportunity with exactly these string fields:
${FIELD_DESCRIPTIONS}

Rules:
- Every field is a string. Use "" for anything not present in the text — never omit a field, never use null.
- Never invent information that isn't in the source text.
- If the text contains multiple distinct postings, return one array element per posting.
- If the text contains only one posting, return a single-element array.
- "sourceText" must be the verbatim original text of that posting, not a paraphrase.`;

export type AiExtractResult =
  | { ok: true; items: BulkDraftOpportunity[] }
  | { ok: false; error: string };

function parseAiJson(text: string): Record<string, unknown>[] | null {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    const value = JSON.parse(cleaned);
    if (Array.isArray(value)) return value as Record<string, unknown>[];
    if (value && typeof value === "object" && Array.isArray((value as { items?: unknown }).items)) {
      return (value as { items: Record<string, unknown>[] }).items;
    }
    return null;
  } catch {
    return null;
  }
}

function fieldStr(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeAiItem(raw: Record<string, unknown>, fallbackSourceText: string): BulkDraftOpportunity {
  return {
    company: fieldStr(raw.company),
    role: fieldStr(raw.role),
    opportunityType: normalizeType(fieldStr(raw.opportunityType)),
    batch: fieldStr(raw.batch),
    degree: fieldStr(raw.degree),
    branches: fieldStr(raw.branches),
    stipend: fieldStr(raw.stipend),
    salary: fieldStr(raw.salary),
    location: fieldStr(raw.location),
    workMode: normalizeWorkMode(fieldStr(raw.workMode)),
    skills: fieldStr(raw.skills),
    responsibilities: fieldStr(raw.responsibilities),
    requirements: fieldStr(raw.requirements),
    eligibility: fieldStr(raw.eligibility),
    additionalDetails: fieldStr(raw.additionalDetails),
    applicationUrl: fieldStr(raw.applicationUrl),
    googleFormUrl: fieldStr(raw.googleFormUrl),
    hrEmail: fieldStr(raw.hrEmail),
    hrContact: fieldStr(raw.hrContact),
    howToApply: fieldStr(raw.howToApply),
    deadline: fieldStr(raw.deadline),
    sourceText: fieldStr(raw.sourceText) || fallbackSourceText,
  };
}

export async function extractOpportunitiesWithAi(rawText: string): Promise<AiExtractResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your-api-key-here") {
    return {
      ok: false,
      error: "AI extraction isn't set up yet — add a real ANTHROPIC_API_KEY to .env.local (see the delivery notes).",
    };
  }

  const client = new Anthropic({ apiKey });

  let responseText: string;
  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: rawText }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return { ok: false, error: "The AI returned no readable output." };
    }
    responseText = textBlock.text;
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI extraction request failed.";
    return { ok: false, error: message };
  }

  const parsed = parseAiJson(responseText);
  if (!parsed) {
    return { ok: false, error: "Could not understand the AI's response — try again or use the regular Parse instead." };
  }

  return { ok: true, items: parsed.map((raw) => normalizeAiItem(raw, rawText)) };
}
