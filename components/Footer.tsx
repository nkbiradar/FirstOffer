import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <span>&copy; {new Date().getFullYear()} FirstOffer &mdash; Fresher opportunities, one place.</span>
        <nav className="footer-links" aria-label="Footer">
          <Link href="/opportunities">Opportunities</Link>
          <Link href="/companies">Companies</Link>
          <Link href="/about">About</Link>
        </nav>
      </div>
    </footer>
  );
}
