import OpportunityForm from "@/components/admin/OpportunityForm";
import { getAllCompanyOptions } from "@/lib/data/companies";

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function NewOpportunityPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const errorParam = Array.isArray(params.error) ? params.error[0] : params.error;
  const companies = await getAllCompanyOptions();

  return (
    <main className="admin-page admin-page-wide">
      <h1>Add Opportunity</h1>
      <OpportunityForm mode="create" companies={companies} errorMessage={errorParam} />
    </main>
  );
}
