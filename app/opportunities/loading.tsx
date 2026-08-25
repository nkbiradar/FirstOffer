function CardSkeleton() {
  return (
    <div className="skeleton-card">
      <div className="skeleton" style={{ height: 38, width: 38, borderRadius: 10 }} />
      <div className="skeleton" style={{ height: 18, width: "70%" }} />
      <div className="skeleton" style={{ height: 13, width: "40%" }} />
      <div className="skeleton" style={{ height: 13, width: "55%" }} />
      <div className="skeleton" style={{ height: 34, width: "100%", borderRadius: 999 }} />
    </div>
  );
}

export default function OpportunitiesLoading() {
  return (
    <main className="page page-wide opportunities-page">
      <div className="container">
        <div className="page-header">
          <div className="skeleton" style={{ height: 22, width: 160, borderRadius: 999 }} />
          <div className="skeleton" style={{ height: 34, width: 280, marginTop: 8 }} />
          <div className="skeleton" style={{ height: 16, width: 340, marginTop: 6 }} />
        </div>
        <div className="opportunity-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      </div>
    </main>
  );
}
