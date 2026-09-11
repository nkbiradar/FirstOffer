import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <span>&copy; {new Date().getFullYear()} FirstOffer &mdash; Fresher opportunities across India.</span>
        <nav className="footer-links" aria-label="Footer">
          <Link href="/fresher-jobs">Fresher Jobs</Link>
          <Link href="/tech-jobs">Tech Jobs</Link>
          <Link href="/off-campus-jobs">Off-Campus</Link>
          <Link href="/opportunities">All Openings</Link>
          <Link href="/companies">Companies</Link>
          <Link href="/about">About</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/refund-policy">Refunds</Link>
        </nav>
      </div>
    </footer>
  );
}
