import { createAdminClient } from "@/lib/supabase/admin";

// "What Worked For Me" — real students who were applying with no interview
// calls, describing what they changed. Free, read-only public page at
// /what-worked. Stories are added and edited by the admin only, at
// /admin/what-worked.
// Table: public.what_worked_stories (see supabase/schema.sql).

export type WhatWorkedStory = {
  id: string;
  display_name: string;
  is_anonymous: boolean;
  college: string | null;
  graduation_batch: string | null;
  target_role: string | null;
  applications_before: string | null;
  what_wasnt_working: string | null;
  what_changed: string;
  result: string;
  tags: string[];
  is_published: boolean;
  submitter_email: string | null;
  created_at: string;
};

/** The change categories a student can tick; also the filter chips on /what-worked. */
export const WHAT_WORKED_TAGS = [
  { slug: "resume", label: "Fixed my resume" },
  { slug: "tailoring", label: "Tailored each application" },
  { slug: "referrals", label: "Asked for referrals" },
  { slug: "hr-emails", label: "Emailed HRs directly" },
  { slug: "linkedin", label: "Improved LinkedIn" },
  { slug: "projects", label: "Built better projects" },
  { slug: "skills", label: "Learned in-demand skills" },
  { slug: "apply-early", label: "Applied early" },
] as const;

export const APPLICATION_RANGES = ["Under 50", "50–100", "100–200", "200+"] as const;

export function tagLabel(slug: string): string {
  return WHAT_WORKED_TAGS.find((t) => t.slug === slug)?.label ?? slug;
}

// Columns safe to send to the public page. The table has NO public RLS
// policy (submitter emails and real names of anonymous posters must never
// be readable with the anon key), so public reads go through the server
// with this explicit list, and anonymous stories are masked below.
const PUBLIC_COLUMNS =
  "id, display_name, is_anonymous, college, graduation_batch, target_role, applications_before, what_wasnt_working, what_changed, result, tags, is_published, created_at";

/** Published stories, newest first. Fails soft (empty list) if the table isn't there yet. */
export async function getPublishedWhatWorked(limit = 100, tag?: string): Promise<WhatWorkedStory[]> {
  let query = createAdminClient()
    .from("what_worked_stories")
    .select(PUBLIC_COLUMNS)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (tag) query = query.contains("tags", [tag]);
  const { data, error } = await query;
  if (error) {
    console.error("getPublishedWhatWorked failed:", error.message);
    return [];
  }
  return ((data ?? []) as unknown as WhatWorkedStory[]).map((s) =>
    s.is_anonymous ? { ...s, display_name: "Anonymous", college: null, submitter_email: null } : { ...s, submitter_email: null },
  );
}

/** Every story (draft or published), for /admin/what-worked. */
export async function getAllWhatWorkedForAdmin(): Promise<WhatWorkedStory[]> {
  const { data, error } = await createAdminClient()
    .from("what_worked_stories")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getAllWhatWorkedForAdmin failed:", error.message);
    return [];
  }
  return (data ?? []) as WhatWorkedStory[];
}

/** "Priya S · NMIT · 2025" or "Anonymous · 2025 batch". */
export function storyByline(s: Pick<WhatWorkedStory, "display_name" | "is_anonymous" | "college" | "graduation_batch">): string {
  if (s.is_anonymous) {
    return ["Anonymous", s.graduation_batch ? `${s.graduation_batch} batch` : null].filter(Boolean).join(" · ");
  }
  return [s.display_name, s.college, s.graduation_batch].filter(Boolean).join(" · ");
}

/**
 * Reads the admin "Add / edit story" form (/admin/what-worked). Stories are
 * entered by the admin only — visitors can just read them on /what-worked.
 */
export function parseWhatWorkedForm(formData: FormData) {
  const text = (key: string, max: number) => String(formData.get(key) ?? "").trim().slice(0, max);
  const apps = text("applications_before", 20);
  const valid = new Set<string>(WHAT_WORKED_TAGS.map((t) => t.slug));
  return {
    display_name: text("display_name", 80),
    is_anonymous: formData.get("is_anonymous") === "on",
    college: text("college", 120) || null,
    graduation_batch: text("graduation_batch", 10) || null,
    target_role: text("target_role", 100) || null,
    applications_before: (APPLICATION_RANGES as readonly string[]).includes(apps) ? apps : null,
    what_wasnt_working: text("what_wasnt_working", 600) || null,
    what_changed: text("what_changed", 1200),
    result: text("result", 300),
    tags: [...new Set(formData.getAll("tags").map(String).filter((t) => valid.has(t)))],
    is_published: formData.get("is_published") === "on",
  };
}
