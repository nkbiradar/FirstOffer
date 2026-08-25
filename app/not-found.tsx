import Link from "next/link";

export default function NotFound() {
  return (
    <main className="state-page">
      <div className="state-page-inner">
        <span className="state-page-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
          </svg>
        </span>
        <h1>We couldn&apos;t find that page</h1>
        <p>It may have been unpublished, expired, or the link might be off. Let&apos;s get you back on track.</p>
        <Link className="btn btn-primary" href="/opportunities">
          Explore Opportunities
        </Link>
      </div>
    </main>
  );
}
