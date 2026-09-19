import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/auth";
import { getUserApplications } from "@/lib/data/user-applications";
import { getUserUnlocks } from "@/lib/data/opportunity-unlocks";
import { getUserSubscription, isSubscriptionAccessActive } from "@/lib/data/subscriptions";
import { isEmailOptedOut } from "@/lib/data/email-preference";
import OpportunityCard from "@/components/OpportunityCard";
import OutcomeTracker from "@/components/OutcomeTracker";
import CountUp from "@/components/CountUp";
import CancelSubscriptionButton from "@/components/CancelSubscriptionButton";
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

// formatRelativeTime (imported above) is built for PAST dates ("2d ago") —
// wrong for a subscription's renewal/cancellation date, which is in the
// future. This is the future-facing counterpart, used only for those two
// fields below.
function formatFutureDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

type SearchParams = { [key: string]: string | string[] | undefined };

// The replacement for the old /applications page — same underlying data
// (user_applications + OutcomeTracker), but framed as a real dashboard:
// summary stat tiles, a status filter, and a panel showing whether this
// user has full site-wide access. Two independent sources feed that panel
// now: a legacy one-time `opportunity_unlocks` row (grandfathered lifetime
// customers from before the pricing switch — `unlocks` here will only
// ever hold 0 or 1 row for a given user) and a recurring `subscriptions`
// row (the current ₹49/month plan — see lib/data/subscriptions.ts). A
// user has at most one of the two in practice, but both are read so
// whichever applies renders correctly. Deliberately still a server
// component reading a `status` query param, no client-side filtering JS —
// same convention /opportunities already uses for its filter pills, so
// this page degrades gracefully with JS off too.
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

  const [applications, unlocks, subscription, internalSubscription, emailOptedOut] = await Promise.all([
    getUserApplications(user.id),
    getUserUnlocks(user.id),
    getUserSubscription(user.id),
    getUserSubscription(user.id, "internal_hr"),
    isEmailOptedOut(user.id),
  ]);

  const interviewCount = applications.filter((a) => a.outcome === "interview").length;
  const offerCount = applications.filter((a) => a.outcome === "offer").length;
  // Legacy one-time payment model: a user has at most one paid row, ever —
  // its presence means grandfathered lifetime access, not "this many
  // opportunities."
  const fullAccessUnlock = unlocks[0] ?? null;
  const subscriptionActive = isSubscriptionAccessActive(subscription);
  const hasFullAccess = Boolean(fullAccessUnlock) || subscriptionActive;
  const internalActive = isSubscriptionAccessActive(internalSubscription);

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

        {hasFullAccess && (
          <div className="access-unlocked-banner">
            <span className="access-unlocked-icon" aria-hidden="true">✅</span>
            <p>
              <strong>You&apos;re ready to apply!</strong> Full apply access is unlocked — HR emails, official
              application links, and Google Forms are visible on every opportunity.
            </p>
          </div>
        )}

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

          {fullAccessUnlock ? (
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
          ) : subscription && subscription.status !== "created" ? (
            <div className="unlock-list">
              <div className="unlock-item" style={{ cursor: "default" }}>
                <span className="unlock-item-avatar">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <div className="unlock-item-body">
                  <p className="unlock-item-role">
                    {subscriptionActive ? "Full access — every opportunity, unlocked" : "Membership ended"}
                  </p>
                  <p className="unlock-item-meta">
                    {subscriptionActive && !subscription.cancelled_at && (
                      <>
                        ₹49/month membership
                        {subscription.current_period_end && <> · renews {formatFutureDate(subscription.current_period_end)}</>}
                      </>
                    )}
                    {subscriptionActive && subscription.cancelled_at && (
                      <>
                        Cancelled — access ends{" "}
                        {subscription.current_period_end ? formatFutureDate(subscription.current_period_end) : "at period end"}
                      </>
                    )}
                    {!subscriptionActive && "Resubscribe from any opportunity page to unlock access again"}
                  </p>
                </div>
                {subscriptionActive && !subscription.cancelled_at && <CancelSubscriptionButton />}
                {!subscriptionActive && (
                  <Link className="btn btn-secondary btn-sm" href="/opportunities">
                    Resubscribe
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <h3>Full access not unlocked yet</h3>
              <p>
                A ₹49/month membership unlocks the application link, Google Form, and HR email/contact on{" "}
                <strong>every</strong> opportunity on FirstOffer — including new ones as they go live. Cancel
                anytime.
              </p>
              <Link className="btn btn-secondary btn-sm" href="/opportunities">
                Browse Opportunities
              </Link>
            </div>
          )}
        </div>

        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h2>🔥 Internal HR Openings access</h2>
          </div>

          {internalSubscription && internalSubscription.status !== "created" ? (
            <div className="unlock-list">
              <div className="unlock-item unlock-item-internal" style={{ cursor: "default" }}>
                <span className="unlock-item-avatar unlock-item-avatar-internal">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <rect x="5" y="11" width="14" height="9" rx="2" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <div className="unlock-item-body">
                  <p className="unlock-item-role">
                    {internalActive ? "Internal HR Openings — unlocked" : "Membership ended"}
                  </p>
                  <p className="unlock-item-meta">
                    {internalActive && !internalSubscription.cancelled_at && (
                      <>
                        ₹39/month membership
                        {internalSubscription.current_period_end && (
                          <> · renews {formatFutureDate(internalSubscription.current_period_end)}</>
                        )}
                      </>
                    )}
                    {internalActive && internalSubscription.cancelled_at && (
                      <>
                        Cancelled — access ends{" "}
                        {internalSubscription.current_period_end
                          ? formatFutureDate(internalSubscription.current_period_end)
                          : "at period end"}
                      </>
                    )}
                    {!internalActive && "Resubscribe from /internal-openings to unlock access again"}
                  </p>
                </div>
                {internalActive && !internalSubscription.cancelled_at && (
                  <CancelSubscriptionButton product="internal_hr" />
                )}
                {!internalActive && (
                  <Link className="btn btn-secondary btn-sm" href="/internal-openings">
                    Resubscribe
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <h3>Internal HR Openings not unlocked yet</h3>
              <p>
                A ₹39/month membership unlocks internal, HR-shared roles with significantly lower competition —
                openings that may never be widely posted elsewhere. Cancel anytime.
              </p>
              <Link className="btn btn-secondary btn-sm" href="/internal-openings">
                View Internal Openings
              </Link>
            </div>
          )}
        </div>

        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h2>Email alerts</h2>
          </div>
          <div className="unlock-list">
            <div className="unlock-item" style={{ cursor: "default" }}>
              <div className="unlock-item-body">
                <p className="unlock-item-role">{emailOptedOut ? "Email alerts are off" : "Email alerts are on"}</p>
                <p className="unlock-item-meta">
                  {emailOptedOut
                    ? "You won't get emailed when new opportunities go live."
                    : `We'll email you at ${user.email} whenever new opportunities are posted — go fast and apply.`}
                </p>
              </div>
              <form action="/api/email/preference" method="post">
                <button
                  className="btn btn-secondary btn-sm"
                  name="intent"
                  value={emailOptedOut ? "on" : "off"}
                  type="submit"
                >
                  {emailOptedOut ? "Turn On" : "Turn Off"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
