// Role categories — every opportunity is auto-sorted into one or more of
// these from its job TITLE, so admins don't tag anything by hand. Built from
// the real titles on FirstOffer (SDE 1, AI/ML Engineer, MIS Analyst, Equity
// Research Analyst, UI/UX Designer, Software Manual Tester, ...). A title
// can land in several (e.g. "AI Product Manager" → AI / ML + Product).
// To add a category or keyword, edit this list — filters update everywhere.

export type RoleCategory = { slug: string; label: string; re: RegExp };

export const ROLE_CATEGORIES: RoleCategory[] = [
  {
    slug: "software",
    label: "Software / SDE",
    re: /\b(sde|software (engineer|developer|development|dev)|developer|full[\s-]?stack|back[\s-]?end|front[\s-]?end|web dev\w*|mobile|android|ios|flutter|react|node(\.?js)?|java|devops|cloud|sre|programmer|application engineer|software intern|software trainee|software engineering)\b/i,
  },
  {
    slug: "ai-ml",
    label: "AI / ML",
    re: /\b(ai|a\.i\.|ml|machine learning|deep learning|data scien\w*|nlp|computer vision|gen\s?ai|llm|artificial intelligence)\b/i,
  },
  {
    slug: "data",
    label: "Data Analyst",
    re: /\b(data analy\w*|data engineer\w*|analytics|mis|power bi|business intelligence|bi analyst|sql)\b/i,
  },
  { slug: "business-analyst", label: "Business Analyst", re: /\b(business analy\w*)\b/i },
  {
    slug: "product",
    label: "Product",
    re: /\b(product manager|product management|product analyst|product owner|apm|associate product)\b/i,
  },
  { slug: "design", label: "Design / UI-UX", re: /\b(design\w*|ui\/?ux|ux|ui)\b/i },
  { slug: "qa", label: "QA / Testing", re: /\b(test(er|ing)?|qa|quality assurance|sdet)\b/i },
  {
    slug: "finance",
    label: "Finance / Research",
    re: /\b(financ\w*|research analyst|equity|account\w*|investment|credit|audit\w*|commodit\w*)\b/i,
  },
  {
    slug: "marketing-sales",
    label: "Marketing / Sales",
    re: /\b(marketing|sales|growth (marketing|hacker|associate|intern)|business development|bde|customer success|content|social media|seo|brand)\b/i,
  },
  {
    slug: "core",
    label: "Core / Hardware",
    re: /\b(electronics|embedded|vlsi|hardware|robotics|mechanical|electrical|civil|firmware|iot|semiconductor)\b/i,
  },
  {
    slug: "hr-ops",
    label: "HR / Operations",
    re: /\b(hr|human resources|recruit\w*|talent acquisition|operations|ops)\b/i,
  },
];

export const ROLE_LABELS: Record<string, string> = Object.fromEntries(ROLE_CATEGORIES.map((c) => [c.slug, c.label]));

export function isRoleSlug(value: string | undefined | null): value is string {
  return Boolean(value && ROLE_LABELS[value]);
}

/** Category slugs for a job title ("Software Manual Tester" → QA only). */
export function categorizeRole(title: string | null | undefined): string[] {
  if (!title) return [];
  let slugs = ROLE_CATEGORIES.filter((c) => c.re.test(title)).map((c) => c.slug);
  // A manual/QA tester is a testing role, not a developer role.
  if (slugs.includes("qa") && /\btester\b|\btesting\b|\bqa\b/i.test(title) && !/\bdevelop/i.test(title)) {
    slugs = slugs.filter((s) => s !== "software");
  }
  return slugs;
}
