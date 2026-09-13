// Deterministic keyword comparison for the Resume Keyword Matcher.
//
// Intentionally NOT model-based: every keyword shown to the user either
// (a) came verbatim from the job's own posted skills/requirements text, or
// (b) is a literal word-boundary match found in the resume text the user
// uploaded. There's no generation step that could invent a skill, which is
// the hard requirement this feature was built under — see
// components/ResumeMatchTool.tsx and app/api/resume-match/route.ts.
import { RELATED_CATEGORIES, SKILL_DICTIONARY, type SkillEntry } from "./skill-dictionary";

const MAX_JD_KEYWORDS = 20;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Word-boundary match that also works for terms ending in symbols like
// "C++", "C#", ".NET", "CI/CD" — plain \b doesn't fire reliably at a
// non-word character, so this checks directly that the character before
// and after the match (if any) isn't itself alphanumeric.
function buildTermRegex(term: string): RegExp {
  return new RegExp(`(?<![A-Za-z0-9])${escapeRegExp(term)}(?![A-Za-z0-9])`, "i");
}

function textContainsTerm(text: string, term: string): boolean {
  return buildTermRegex(term).test(text);
}

function surfaceForms(entry: SkillEntry): string[] {
  return [entry.canonical, ...entry.aliases];
}

function findDictionaryEntry(term: string): SkillEntry | undefined {
  const lower = term.trim().toLowerCase();
  return SKILL_DICTIONARY.find((entry) => surfaceForms(entry).some((f) => f.toLowerCase() === lower));
}

/** Every dictionary skill that's literally present (by name or alias) in a block of free text. */
export function findSkillEntriesInText(text: string): Set<string> {
  const found = new Set<string>();
  for (const entry of SKILL_DICTIONARY) {
    if (surfaceForms(entry).some((form) => textContainsTerm(text, form))) {
      found.add(entry.canonical);
    }
  }
  return found;
}

export type JdKeywordSource = {
  skills: string[];
  requirements: string[];
  responsibilities: string[];
  role: string;
  eligibility: string | null;
  additionalDetails: string | null;
};

/**
 * The JD's "required keywords" — admin-entered `skills` first (highest
 * signal, already curated by whoever posted the job), topped up with any
 * dictionary skills additionally mentioned in the JD's own requirements/
 * responsibilities/role/eligibility text. Every keyword traces back to text
 * the job posting itself contains — nothing here is inferred or invented.
 */
export function buildJdKeywords(source: JdKeywordSource): string[] {
  const keywords: string[] = [];
  const seen = new Set<string>();

  for (const raw of source.skills) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const entry = findDictionaryEntry(trimmed);
    const canonical = entry?.canonical ?? trimmed;
    const key = canonical.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      keywords.push(canonical);
    }
  }

  const supplementaryText = [
    source.role,
    ...source.requirements,
    ...source.responsibilities,
    source.eligibility ?? "",
    source.additionalDetails ?? "",
  ].join("\n");

  for (const canonical of findSkillEntriesInText(supplementaryText)) {
    const key = canonical.toLowerCase();
    if (!seen.has(key) && keywords.length < MAX_JD_KEYWORDS) {
      seen.add(key);
      keywords.push(canonical);
    }
  }

  return keywords.slice(0, MAX_JD_KEYWORDS);
}

export type RelatedKeyword = { jdKeyword: string; foundAs: string };

export type KeywordMatchResult = {
  matching: string[];
  missing: string[];
  related: RelatedKeyword[];
  matchPercent: number;
  totalJdKeywords: number;
};

/**
 * Compares resume text against the JD keyword list. A keyword counts as
 * matching if the exact term OR one of its known aliases appears in the
 * resume. If not, but the resume mentions a *different* skill from the same
 * comparable category (e.g. JD wants PostgreSQL, resume has MySQL), that's
 * surfaced separately as "related" rather than a flat miss. matchPercent is
 * matching-only — related keywords are informational, not credited, so the
 * percentage keeps one honest meaning: literal keywords the JD wants that
 * are actually already in the resume.
 */
export function matchResumeToJd(resumeText: string, jdKeywords: string[]): KeywordMatchResult {
  const matching: string[] = [];
  const missing: string[] = [];
  const related: RelatedKeyword[] = [];

  for (const jdKeyword of jdKeywords) {
    const entry = findDictionaryEntry(jdKeyword);
    const forms = entry ? surfaceForms(entry) : [jdKeyword];

    if (forms.some((form) => textContainsTerm(resumeText, form))) {
      matching.push(jdKeyword);
      continue;
    }

    if (entry && RELATED_CATEGORIES.has(entry.category)) {
      const cousin = SKILL_DICTIONARY.find(
        (candidate) =>
          candidate.category === entry.category &&
          candidate.canonical !== entry.canonical &&
          surfaceForms(candidate).some((form) => textContainsTerm(resumeText, form)),
      );
      if (cousin) {
        related.push({ jdKeyword, foundAs: cousin.canonical });
        continue;
      }
    }

    missing.push(jdKeyword);
  }

  const totalJdKeywords = jdKeywords.length;
  const matchPercent = totalJdKeywords === 0 ? 0 : Math.round((matching.length / totalJdKeywords) * 100);

  return { matching, missing, related, matchPercent, totalJdKeywords };
}
