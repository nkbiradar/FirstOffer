import Link from "next/link";

// Shown INSIDE the Android app in place of UnlockContactCard (see
// lib/nativeAppServer.ts for why). Deliberately neutral: no price, no
// purchase button, and no link or wording that sends the user to buy
// somewhere else. Google Play policy forbids both. Signing in is allowed,
// so existing members can get their access.
export default function AppMembersOnlyNote({
  isSignedIn,
  next,
  what = "How to apply for this role — HR email, application link or form — is available to FirstOffer members.",
}: {
  isSignedIn: boolean;
  next: string;
  what?: string;
}) {
  return (
    <div className="unlock-contact-card app-members-note">
      <span className="unlock-contact-eyebrow">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Members only
      </span>
      <p className="unlock-contact-desc">{what}</p>
      {!isSignedIn && (
        <Link className="btn btn-primary" href={`/login?next=${encodeURIComponent(next)}`}>
          Already a member? Sign in
        </Link>
      )}
    </div>
  );
}
