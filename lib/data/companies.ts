import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Company } from "@/types/supabase";

export type CompanyWithOpportunityCount = Company & {
  publishedOpportunityCount: number;
};

/** Companies with a count of their published, non-expired opportunities. */
export async function getCompaniesWithPublishedCounts(): Promise<CompanyWithOpportunityCount[]> {
  const supabase = await createClient();

  const { data: companies, error: companiesError } = await supabase
    .from("companies")
    .select("*")
    .order("name", { ascending: true });

  if (companiesError) {
    console.error("getCompaniesWithPublishedCounts failed:", companiesError.message);
    return [];
  }

  if (!companies || companies.length === 0) {
    return [];
  }

  const { data: opportunities, error: opportunitiesError } = await supabase
    .from("opportunities")
    .select("company_id")
    .eq("status", "published")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .not("company_id", "is", null);

  if (opportunitiesError) {
    console.error("getCompaniesWithPublishedCounts failed:", opportunitiesError.message);
  }

  const counts = new Map<string, number>();
  for (const row of (opportunities ?? []) as { company_id: string | null }[]) {
    if (!row.company_id) continue;
    counts.set(row.company_id, (counts.get(row.company_id) ?? 0) + 1);
  }

  return companies.map((company) => ({
    ...company,
    publishedOpportunityCount: counts.get(company.id) ?? 0,
  }));
}

export type CompanyOption = { id: string; name: string };

/**
 * All companies (id + name only), for the admin "select existing company"
 * dropdown. Uses the service-role client for consistency with the rest of
 * the admin data layer, though the public `companies` RLS policy would
 * allow this read either way.
 */
export async function getAllCompanyOptions(): Promise<CompanyOption[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("companies")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    console.error("getAllCompanyOptions failed:", error.message);
    return [];
  }

  return (data ?? []) as CompanyOption[];
}

function slugify(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "company";
}

/**
 * Finds a company by case-insensitive exact name match, or creates one.
 * Used when the admin opportunity form's "create new company" text input is
 * filled in (see resolveCompanyId in lib/data/admin-opportunities.ts) — so
 * typing "Vedantu" twice across two opportunities never creates duplicate
 * company rows.
 *
 * Uses the service-role client: RLS only grants public SELECT, and
 * creating a company here happens as an admin action.
 */
export async function findOrCreateCompanyId(rawName: string): Promise<string> {
  const name = rawName.trim();
  if (!name) throw new Error("Company name is required.");

  const admin = createAdminClient();

  const { data: existing, error: findError } = await admin
    .from("companies")
    .select("id")
    .ilike("name", name)
    .limit(1)
    .maybeSingle();

  if (findError) throw new Error(`Company lookup failed: ${findError.message}`);
  if (existing) return existing.id;

  const baseSlug = slugify(name);
  let slug = baseSlug;
  let attempt = 1;

  // Slugs are unique; retry with a numeric suffix on collision (e.g. two
  // differently-named companies that slugify to the same string).
  while (attempt < 20) {
    const { data: created, error: insertError } = await admin
      .from("companies")
      .insert({ name, slug })
      .select("id")
      .single();

    if (!insertError) return created.id;

    if (insertError.code === "23505") {
      attempt += 1;
      slug = `${baseSlug}-${attempt}`;
      continue;
    }

    throw new Error(`Company creation failed: ${insertError.message}`);
  }

  throw new Error("Company creation failed: could not generate a unique slug.");
}
