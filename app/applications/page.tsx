import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/auth";
import { getUserApplications } from "@/lib/data/user-applications";
import OpportunityCard from "@/components/OpportunityCard";
import OutcomeTracker from "@/components/OutcomeTracker";
import { formatRelativeTime } from "@/lib/ui-format";

// "Did you hear back?" only shows up once enough time has passed to be a
// reasonable question — asking the day someone applies is just noise.
const OUTCOME_PROMPT_DELAY_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

// Signed-in-user-only page (any Google-authenticated user, not admin-gated).
// Unmarking an application happens from the opportunity detail page's
// ApplyTracker, not from here — OpportunityCard is a single full-card
// <Link>, so nesting a second interactive "Remove" control inside it would
// mean invalid/awkward nested-interactive markup; simplest to keep this
// page read-only and let the detail page own the toggle.
export default async function ApplicationsPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/applications");

  const applications = await getUserApplications(user.id);

  return (
    <main className="page page-wide">
      <div className="container">
        <div className="page-header">
          <span className="eyebrow">
            <span className="eyebrow-dot" />
            My Applications
          </span>
          <h1>Applications you&apos;re tracking</h1>
          <p>
            {applications.length === 0
              ? "Nothing tracked yet."
              : `${applications.length} opportunit${applications.length === 1 ? "y" : "ies"} marked as applied.`}
          </p>
        </div>

        {applications.length === 0 ? (
          <div className="empty-state">
            <h3>No applications tracked yet</h3>
            <p>Open an opportunity and click &quot;Mark as Applied&quot; to track it here.</p>
            <Link className="btn btn-secondary btn-sm" href="/opportunities">
              Browse Opportunities
            </Link>
          </div>
        ) : (
          <div className="opportunity-grid">
            {applications.map((opportunity) => (
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
      </div>
    </main>
  );
}
