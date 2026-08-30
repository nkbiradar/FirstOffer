import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAdminDashboardStats } from "@/lib/data/admin-opportunities";
import CountUp from "@/components/CountUp";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const stats = await getAdminDashboardStats();

  return (
    <div className="admin-shell">
      <main className="admin-page">
        <span className="eyebrow">
          <span className="eyebrow-dot" />
          Admin
        </span>
        <h1 style={{ marginTop: 12 }}>Dashboard</h1>
        <p className="admin-eyebrow">Signed in as {user?.email ?? "unknown"}</p>

        <div className="admin-stats">
          <div className="card admin-stat">
            <span className="admin-stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="7" width="18" height="12" rx="2" />
                <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="admin-stat-value">
              <CountUp value={stats.total} />
            </span>
            <span className="admin-stat-label">Total Opportunities</span>
          </div>
          <div className="card admin-stat">
            <span className="admin-stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="admin-stat-value">
              <CountUp value={stats.todayPublished} />
            </span>
            <span className="admin-stat-label">Published Today</span>
          </div>
          <div className="card admin-stat">
            <span className="admin-stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="admin-stat-value">
              <CountUp value={stats.drafts} />
            </span>
            <span className="admin-stat-label">Drafts</span>
          </div>
          <div className="card admin-stat">
            <span className="admin-stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="admin-stat-value">
              <CountUp value={stats.expired} />
            </span>
            <span className="admin-stat-label">Expired</span>
          </div>
        </div>

        <div className="admin-dashboard-actions">
          <Link className="btn btn-primary" href="/admin/opportunities/new">
            + Add Opportunity
          </Link>
          <Link className="btn btn-secondary" href="/admin/opportunities/import">
            Bulk Import
          </Link>
          <Link className="btn btn-secondary" href="/admin/opportunities">
            Manage Opportunities
          </Link>
          <Link className="btn btn-secondary" href="/admin/companies">
            Manage Companies
          </Link>
          <Link className="btn btn-secondary" href="/admin/testimonials">
            Manage Testimonials
          </Link>
        </div>
      </main>
    </div>
  );
}
