import { notFound } from "next/navigation";
import OpportunityForm from "@/components/admin/OpportunityForm";
import { getOpportunityByIdForAdmin } from "@/lib/data/admin-opportunities";
import { getAllCompanyOptions } from "@/lib/data/companies";

type Params = { id: string };
type SearchParams = { [key: string]: string | string[] | undefined };

export default async function EditOpportunityPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const errorParam = Array.isArray(query.error) ? query.error[0] : query.error;

  const [opportunity, companies] = await Promise.all([
    getOpportunityByIdForAdmin(id),
    getAllCompanyOptions(),
  ]);
  if (!opportunity) notFound();

  return (
    <div className="admin-shell">
      <main className="admin-page admin-page-wide">
        <div className="admin-page-header">
          <h1>Edit Opportunity</h1>
        </div>
        <OpportunityForm mode="edit" opportunity={opportunity} companies={companies} errorMessage={errorParam} />
      </main>
    </div>
  );
}
