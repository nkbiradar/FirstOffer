export default function OpportunityDetailLoading() {
  return (
    <main className="page opportunity-detail">
      <div className="container" style={{ maxWidth: 760, padding: 0 }}>
        <div className="skeleton" style={{ height: 14, width: 140, marginBottom: 20 }} />
        <div className="card detail-header">
          <div className="skeleton" style={{ height: 38, width: 38, borderRadius: 10, marginBottom: 14 }} />
          <div className="skeleton" style={{ height: 30, width: "70%", marginBottom: 14 }} />
          <div className="skeleton" style={{ height: 24, width: "50%", marginBottom: 14 }} />
          <div className="skeleton" style={{ height: 44, width: 160, borderRadius: 999 }} />
        </div>
        {Array.from({ length: 3 }).map((_, index) => (
          <section className="card" key={index}>
            <div className="skeleton" style={{ height: 14, width: 120, marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 13, width: "100%", marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 13, width: "85%" }} />
          </section>
        ))}
      </div>
    </main>
  );
}
