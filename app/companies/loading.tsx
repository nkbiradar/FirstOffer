export default function CompaniesLoading() {
  return (
    <main className="page page-wide companies-page">
      <div className="container">
        <div className="page-header">
          <div className="skeleton" style={{ height: 22, width: 140, borderRadius: 999 }} />
          <div className="skeleton" style={{ height: 34, width: 220, marginTop: 8 }} />
        </div>
        <div className="company-grid">
          {Array.from({ length: 8 }).map((_, index) => (
            <div className="skeleton-card" key={index} style={{ justifyItems: "center", textAlign: "center" }}>
              <div className="skeleton" style={{ height: 52, width: 52, borderRadius: 14 }} />
              <div className="skeleton" style={{ height: 15, width: "70%" }} />
              <div className="skeleton" style={{ height: 12, width: "50%" }} />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
