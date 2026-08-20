import Link from "next/link";
import { getOpportunitiesForAdmin } from "@/lib/data/admin-opportunities";
import DeleteOpportunityButton from "@/components/admin/DeleteOpportunityButton";
import type { OpportunityStatus } from "@/types/supabase";

const TABS: { label: string; value: OpportunityStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
  { label: "Expired", value: "expired" },
];

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function AdminOpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const statusParam = Array.isArray(params.status) ? params.status[0] : params.status;
  const activeTab = TABS.find((tab) => tab.value === statusParam)?.value ?? "all";
  const status = activeTab === "all" ? undefined : activeTab;

  const opportunities = await getOpportunitiesForAdmin(status);

  return (
    <main className="admin-page admin-page-wide">
      <div className="admin-page-header">
        <h1>Opportunities</h1>
        <Link className="btn-primary" href="/admin/opportunities/new">
          + Add Opportunity
        </Link>
      </div>

      <nav className="admin-tabs">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            className={activeTab === tab.value ? "active" : ""}
            href={tab.value === "all" ? "/admin/opportunities" : `/admin/opportunities?status=${tab.value}`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {opportunities.length === 0 ? (
        <p className="empty-state">
          No opportunities{status ? ` with status "${status}"` : ""} yet.
        </p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Role</th>
              <th>Type</th>
              <th>Status</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map((opportunity) => (
              <tr key={opportunity.id}>
                <td>{opportunity.company?.name ?? "—"}</td>
                <td>{opportunity.role}</td>
                <td>{opportunity.opportunity_type ?? "—"}</td>
                <td>
                  <span className={`status-badge status-${opportunity.status}`}>
                    {opportunity.status}
                  </span>
                </td>
                <td>{new Date(opportunity.created_at).toLocaleDateString("en-IN")}</td>
                <td className="admin-table-actions">
                  <Link href={`/admin/opportunities/${opportunity.id}/edit`}>Edit</Link>
                  <DeleteOpportunityButton id={opportunity.id} role={opportunity.role} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
