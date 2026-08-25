"use client";

// Next.js requires error.tsx to be a Client Component — this is a
// framework-mandated error boundary, not new application logic.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="state-page">
      <div className="state-page-inner">
        <span className="state-page-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 9v4m0 4h.01M10.3 3.9l-8 14A2 2 0 004 21h16a2 2 0 001.7-3.1l-8-14a2 2 0 00-3.4 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h1>Something went wrong</h1>
        <p>An unexpected error occurred while loading this page. You can try again.</p>
        <button className="btn btn-primary" type="button" onClick={() => reset()}>
          Try again
        </button>
      </div>
    </main>
  );
}
