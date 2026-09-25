import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-trust" role="list" aria-label="Trust and security">
          <span className="footer-trust-item" role="listitem">
            <svg
              className="footer-trust-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            SSL Encrypted
          </span>
          <span className="footer-trust-item" role="listitem">
            <svg
              className="footer-trust-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            Verified Listings
          </span>
          <span className="footer-trust-item" role="listitem">
            <svg
              className="footer-trust-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="6" width="18" height="12" rx="2" />
              <path d="M3 10h18" />
            </svg>
            Secure Payments &middot; Razorpay
          </span>
          <a
            className="footer-trust-item"
            href="mailto:support@firstoffer.online"
            role="listitem"
          >
            <svg
              className="footer-trust-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 7l9 6 9-6" />
            </svg>
            Email Support
          </a>
        </div>
        <div className="footer-inner">
          <span>&copy; {new Date().getFullYear()} FirstOffer &mdash; Fresher opportunities across India.</span>
          <nav className="footer-links" aria-label="Footer">
            <Link href="/fresher-jobs">Fresher Jobs</Link>
            <Link href="/tech-jobs">Tech Jobs</Link>
            <Link href="/off-campus-jobs">Off-Campus</Link>
            <Link href="/opportunities">All Openings</Link>
            <Link href="/companies">Companies</Link>
            <Link href="/resume-match">Resume Matcher</Link>
            <Link href="/about">About</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/refund-policy">Refunds</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
