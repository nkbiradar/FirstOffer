import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-trust" role="list" aria-label="Trust and security">
          <span className="footer-trust-item" role="listitem">
            <span className="footer-trust-icon" aria-hidden="true">
              🔒
            </span>
            SSL Secured
          </span>
          <span className="footer-trust-item" role="listitem">
            <span className="footer-trust-icon" aria-hidden="true">
              ✅
            </span>
            Verified Listings
          </span>
          <span className="footer-trust-item" role="listitem">
            <span className="footer-trust-icon" aria-hidden="true">
              💳
            </span>
            Secure Payments via Razorpay
          </span>
          <a
            className="footer-trust-item"
            href="mailto:nayankumarb3110@gmail.com"
            role="listitem"
          >
            <span className="footer-trust-icon" aria-hidden="true">
              ✉️
            </span>
            Real Human Support
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
