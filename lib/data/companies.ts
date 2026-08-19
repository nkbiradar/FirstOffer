import { createClient } from "@/lib/supabase/server";
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
