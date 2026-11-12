// Referral openings — companies where our employees can refer Internal HR
// members. See the "Referral openings" block in supabase/schema.sql.
import { createAdminClient } from "@/lib/supabase/admin";

/** Extra details the admin can ask for, on top of resume + email + mobile. */
export const REFERRAL_EXTRA_FIELDS = [
  { key: "linkedin", label: "LinkedIn profile", type: "url", placeholder: "https://linkedin.com/in/your-name", hosts: ["linkedin.com"] },
  { key: "github", label: "GitHub profile", type: "url", placeholder: "https://github.com/your-username", hosts: ["github.com"] },
  { key: "coding", label: "Coding profile (LeetCode, CodeChef, Codeforces…)", type: "url", placeholder: "https://leetcode.com/u/your-username" },
  { key: "portfolio", label: "Portfolio / personal website", type: "url", placeholder: "https://your-site.com" },
  { key: "college", label: "College & graduation year", type: "text", placeholder: "IIIT Dharwad, 2026" },
  { key: "experience", label: "Experience / current status", type: "text", placeholder: "Fresher · 6-month internship at …" },
  { key: "notice", label: "Notice period / joining availability", type: "text", placeholder: "Immediate joiner" },
  { key: "notes", label: "Anything else for the referrer", type: "textarea", placeholder: "Skills, projects, why you fit this role…" },
] as const;

export type ReferralFieldKey = (typeof REFERRAL_EXTRA_FIELDS)[number]["key"];
export type FieldMode = "required" | "optional";
export type ReferralFields = Partial<Record<ReferralFieldKey, FieldMode>>;

export type ReferralOpening = {
  id: string;
  company: string;
  role: string | null;
  location: string | null;
  details: string | null;
  apply_by: string | null;
  fields: ReferralFields;
  is_active: boolean;
  created_at: string;
};

export type ReferralApplication = {
  id: string;
  opening_id: string;
  user_id: string;
  details: Record<string, string>;
  created_at: string;
  updated_at: string;
};

const COLUMNS = "id, company, role, location, details, apply_by, fields, is_active, created_at";

/** Active openings whose apply-by date (if any) hasn't passed, newest first. */
export async function getActiveReferralOpenings(): Promise<ReferralOpening[]> {
  const admin = createAdminClient();
  const today = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10); // IST date
  const { data, error } = await admin
    .from("referral_openings")
    .select(COLUMNS)
    .eq("is_active", true)
    .or(`apply_by.is.null,apply_by.gte.${today}`)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getActiveReferralOpenings:", error.message);
    return [];
  }
  return (data ?? []) as ReferralOpening[];
}

export async function getReferralOpening(id: string): Promise<ReferralOpening | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("referral_openings").select(COLUMNS).eq("id", id).maybeSingle();
  return (data as ReferralOpening | null) ?? null;
}

export async function getAllReferralOpeningsForAdmin(): Promise<
  (ReferralOpening & { applications: ReferralApplication[] })[]
> {
  const admin = createAdminClient();
  const [{ data: openings, error }, { data: apps }] = await Promise.all([
    admin.from("referral_openings").select(COLUMNS).order("created_at", { ascending: false }),
    admin
      .from("referral_opening_applications")
      .select("id, opening_id, user_id, details, created_at, updated_at")
      .order("updated_at", { ascending: false }),
  ]);
  if (error) console.error("getAllReferralOpeningsForAdmin:", error.message);
  const byOpening = new Map<string, ReferralApplication[]>();
  for (const a of (apps ?? []) as ReferralApplication[]) {
    byOpening.set(a.opening_id, [...(byOpening.get(a.opening_id) ?? []), a]);
  }
  return ((openings ?? []) as ReferralOpening[]).map((o) => ({ ...o, applications: byOpening.get(o.id) ?? [] }));
}

/** Opening ids this user has already applied to. */
export async function getMyReferralApplications(userId: string): Promise<Record<string, string>> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("referral_opening_applications")
    .select("opening_id, updated_at")
    .eq("user_id", userId);
  return Object.fromEntries((data ?? []).map((r) => [r.opening_id as string, r.updated_at as string]));
}

/** Optional link: "" when blank, null when invalid, else a normalised URL. */
export function cleanUrl(raw: FormDataEntryValue | null, hosts?: readonly string[]): string | null {
  let v = String(raw ?? "").trim().slice(0, 200);
  if (!v) return "";
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
  try {
    const u = new URL(v);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    if (!host.includes(".")) return null;
    if (hosts && !hosts.some((h) => host === h || host.endsWith(`.${h}`))) return null;
    return u.toString();
  } catch {
    return null;
  }
}
