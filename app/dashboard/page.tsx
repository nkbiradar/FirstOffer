import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/auth";
import { getUserApplications } from "@/lib/data/user-applications";
import { getUserUnlocks } from "@/lib/data/opportunity-unlocks";
import OpportunityCard from "@/components/OpportunityCard";
import OutcomeTracker from "@/components/OutcomeTracker";
import CountUp from "@/components/CountUp";
import { formatRelativeTime } from "@/lib/ui-format";
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
// summary stat tiles, a status filter, and a panel showing whether this
// user has full site-wide access (opportunity_unlocks). The unlock is now
// a single one-time payment, not per-opportunity, so `unlocks` here will
// only ever hold 0 or 1 row for a given user — see
// lib/data/opportunity-unlocks.ts's hasFullAccess(). Deliberately still a
// server component reading a `status` query param, no client-side
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
  // One-time payment model: a user has at most one paid row, ever — its
  // presence means full site-wide access, not "this many opportunities."
  const fullAccessUnlock = unlocks[0] ?? null;
  const hasFullAccess = Boolean(fullAccessUnlock);

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
              <StatIcon
                path={
                  hasFullAccess
                    ? "M5 13l4 4L19 7"
                    : "M12 15v2M7 10V7a5 5 0 0110 0v3M5 10h14v9a2 2 0 01-2 2H7a2 2 0 01-2-2v-9z"
                }
              />
            </span>
            <span className="admin-stat-value">{hasFullAccess ? "Unlocked" : "Locked"}</span>
            <span className="admin-stat-label">Full Site Access</span>
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
            <h2>Site access</h2>
          </div>

          {!fullAccessUnlock ? (
            <div className="empty-state">
              <h3>Full access not unlocked yet</h3>
              <p>
                A single one-time payment unlocks the application link, Google Form, and HR email/contact on{" "}
                <strong>every</strong> opportunity on FirstOffer — not just one.
              </p>
              <Link className="btn btn-secondary btn-sm" href="/opportunities">
                Browse Opportunities
              </Link>
            </div>
          ) : (
            <div className="unlock-list">
              <div className="unlock-item" style={{ cursor: "default" }}>
                <span className="unlock-item-avatar">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <div className="unlock-item-body">
                  <p className="unlock-item-role">Full access — every opportunity, unlocked</p>
                  <p className="unlock-item-meta">One-time payment · never expires</p>
                </div>
                <span className="unlock-item-amount">
                  ₹{(fullAccessUnlock.amount_paise / 100).toFixed(0)}
                  <span className="unlock-item-date">{formatRelativeTime(fullAccessUnlock.paid_at) ?? ""}</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
