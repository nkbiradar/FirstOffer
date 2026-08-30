import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/auth";
import { getUserApplications } from "@/lib/data/user-applications";
import { getUserUnlocks } from "@/lib/data/opportunity-unlocks";
import OpportunityCard from "@/components/OpportunityCard";
import OutcomeTracker from "@/components/OutcomeTracker";
import CountUp from "@/components/CountUp";
import { avatarGradient, formatRelativeTime, initials } from "@/lib/ui-format";
import type { ApplicationOutcome } from "@/types/supabase";

// "Did you hear back?" only shows up once enough time has passed to be a
// reasonable question — asking the day someone applies is just noise.
const OUTCOME_PROMPT_DELAY_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

type StatusFilter = "all" | "pending" | ApplicationOutcome;
const VALID_FILTERS: StatusFilter[] = ["all", "pending", "interview", "offer", "rejected", "no_response"];

const FILTER_LABELS: Record<StatusFilter, string> = {
  all: "All",
  pending: "Awaiting update",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  no_response: "No response",
};

function StatIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d={path} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type SearchParams = { [key: string]: string | string[] | undefined };

// The replacement for the old /applications page — same underlying data
// (user_applications + OutcomeTracker), but framed as a real dashboard:
// summary stat tiles, a status filter, and a second panel for what the
// user has actually paid to unlock (opportunity_unlocks). Deliberately
// still a server component reading a `status` query param, no client-side
// filtering JS — same convention /opportunities already uses for its
// filter pills, so this page degrades gracefully with JS off too.
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await getUser();
  if (!user) redirect("/login?next=/dashboard");

  const params = await searchParams;
  const statusParam = Array.isArray(params.status) ? params.status[0] : params.status;
  const status: StatusFilter = VALID_FILTERS.includes(statusParam as StatusFilter)
    ? (statusParam as StatusFilter)
    : "all";

  const [applications, unlocks] = await Promise.all([getUserApplications(user.id), getUserUnlocks(user.id)]);

  const interviewCount = applications.filter((a) => a.outcome === "interview").length;
  const offerCount = applications.filter((a) => a.outcome === "offer").length;
  const totalSpentRupees = unlocks.reduce((sum, u) => sum + u.amount_paise, 0) / 100;

  const filtered =
    status === "all"
      ? applications
      : status === "pending"
        ? applications.filter((a) => !a.outcome)
        : applications.filter((a) => a.outcome === status);

  return (
    <main className="page page-wide">
      <div className="container">
        <div className="page-header">
          <span className="eyebrow">
            <span className="eyebrow-dot" />
            Dashboard
          </span>
          <h1>Welcome back{user.email ? `, ${user.email.split("@")[0]}` : ""}</h1>
          <p>Every opportunity you&apos;ve applied to and unlocked, all in one place.</p>
        </div>

        <div className="dashboard-stats">
          <div className="admin-stat">
            <span className="admin-stat-icon">
              <StatIcon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </span>
            <span className="admin-stat-value">
              <CountUp value={applications.length} />
            </span>
            <span className="admin-stat-label">Applications Tracked</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat-icon">
              <StatIcon path="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3zM9 12l2 2 4-4" />
            </span>
            <span className="admin-stat-value">
              <CountUp value={interviewCount} />
            </span>
            <span className="admin-stat-label">Interview Calls</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat-icon">
              <StatIcon path="M12 15a4 4 0 100-8 4 4 0 000 8zM6 21l1.5-4.5M18 21l-1.5-4.5" />
            </span>
            <span className="admin-stat-value">
              <CountUp value={offerCount} />
            </span>
            <span className="admin-stat-label">Offers</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat-icon">
              <StatIcon path="M12 15v2M7 10V7a5 5 0 0110 0v3M5 10h14v9a2 2 0 01-2 2H7a2 2 0 01-2-2v-9z" />
            </span>
            <span className="admin-stat-value">
              <CountUp value={unlocks.length} />
            </span>
            <span className="admin-stat-label">Opportunities Unlocked</span>
          </div>
        </div>

        <div className="toolbar">
          <div className="dashboard-tabs">
            {VALID_FILTERS.map((f) => (
              <Link
                key={f}
                href={f === "all" ? "/dashboard" : `/dashboard?status=${f}`}
                className={`filter-pill ${status === f ? "active" : ""}`}
              >
                {FILTER_LABELS[f]}
              </Link>
            ))}
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="empty-state">
            <h3>No applications tracked yet</h3>
            <p>Open an opportunity and click &quot;Mark as Applied&quot; to track it here.</p>
            <Link className="btn btn-secondary btn-sm" href="/opportunities">
              Browse Opportunities
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <h3>Nothing in this filter yet</h3>
            <p>Try a different status, or view all your applications.</p>
            <Link className="btn btn-secondary btn-sm" href="/dashboard">
              View All
            </Link>
          </div>
        ) : (
          <div className="opportunity-grid">
            {filtered.map((opportunity) => (
              <div className="application-item" key={opportunity.id}>
                <OpportunityCard opportunity={opportunity} />
                <OutcomeTracker
                  opportunityId={opportunity.id}
                  appliedLabel={formatRelativeTime(opportunity.applied_at)}
                  initialOutcome={opportunity.outcome}
                  eligibleForPrompt={Date.now() - new Date(opportunity.applied_at).getTime() >= OUTCOME_PROMPT_DELAY_MS}
                />
              </div>
            ))}
          </div>
        )}

        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h2>Unlocked opportunities</h2>
            {unlocks.length > 0 && (
              <span className="dashboard-section-count">
                ₹{totalSpentRupees.toFixed(0)} spent total
              </span>
            )}
          </div>

          {unlocks.length === 0 ? (
            <div className="empty-state">
              <h3>No unlocks yet</h3>
              <p>When you unlock an opportunity&apos;s apply details, it&apos;ll show up here.</p>
            </div>
          ) : (
            <div className="unlock-list">
              {unlocks.map((unlock, index) => {
                const company = unlock.opportunity.company;
                const companyName = company?.name ?? "";
                const { a, b } = avatarGradient(companyName || unlock.opportunity.role);
                return (
                  <Link
                    key={`${unlock.opportunity.id}-${index}`}
                    href={`/opportunities/${unlock.opportunity.id}`}
                    className="unlock-item"
                    style={{ ["--avatar-a" as string]: a, ["--avatar-b" as string]: b }}
                  >
                    <span className="unlock-item-avatar">
                      {company?.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img alt="" src={company.logo_url} style={{ width: "100%", height: "100%", borderRadius: "inherit", objectFit: "cover" }} />
                      ) : (
                        initials(companyName || unlock.opportunity.role)
                      )}
                    </span>
                    <div className="unlock-item-body">
                      <p className="unlock-item-role">{unlock.opportunity.role}</p>
                      <p className="unlock-item-meta">{companyName || "—"}</p>
                    </div>
                    <span className="unlock-item-amount">
                      ₹{(unlock.amount_paise / 100).toFixed(0)}
                      <span className="unlock-item-date">{formatRelativeTime(unlock.paid_at) ?? ""}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
