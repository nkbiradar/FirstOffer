import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAdminDashboardStats } from "@/lib/data/admin-opportunities";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const stats = await getAdminDashboardStats();

  return (
    <main className="admin-page">
      <h1>Admin dashboard</h1>
      <p>Signed in as {user?.email ?? "unknown"}.</p>

      <div className="admin-stats">
        <div className="admin-stat">
          <span className="admin-stat-value">{stats.total}</span>
          <span className="admin-stat-label">Total Opportunities</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-value">{stats.todayPublished}</span>
          <span className="admin-stat-label">Published Today</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-value">{stats.drafts}</span>
          <span className="admin-stat-label">Drafts</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-value">{stats.expired}</span>
          <span className="admin-stat-label">Expired</span>
        </div>
      </div>

      <div className="admin-dashboard-actions">
        <Link className="btn-primary" href="/admin/opportunities/new">
          + Add Opportunity
        </Link>
        <Link href="/admin/opportunities">Manage Opportunities</Link>
      </div>
    </main>
  );
}
