// Small trust tags for the ₹99 full-access plan: "Most popular" always,
// plus "Chosen by 40+ students" when there's a real paid-member count
// (see getPaidMemberLabel in lib/data/subscriptions.ts). No ratings or
// reviews are shown because none are collected.
// "Trusted by N+ students": N is the live sign-up count rounded down to
// the nearest 50 (see lib/student-count.ts), passed in by the page.
import { STUDENT_COUNT_FALLBACK_LABEL } from "@/lib/student-count";

export default function PlanTags(props: { memberLabel?: string | null }) {
  const memberLabel = props.memberLabel || STUDENT_COUNT_FALLBACK_LABEL;
  return (
    <div className="plan-tags">
      <span className="plan-tag plan-tag-popular">
        <svg aria-hidden="true" fill="currentColor" height="12" viewBox="0 0 24 24" width="12">
          <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" />
        </svg>
        Most popular
      </span>
      {memberLabel && (
        <span className="plan-tag plan-tag-members">
          <svg aria-hidden="true" fill="none" height="12" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24" width="12">
            <path d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM22 19v-1a4 4 0 0 0-3-3.9M16 3.1a3.5 3.5 0 0 1 0 6.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Trusted by {memberLabel} students
        </span>
      )}
    </div>
  );
}
