export default function ImportOpportunityPage() {
  return (
    <div className="admin-shell">
      <main className="admin-page">
        <span className="eyebrow">
          <span className="eyebrow-dot" />
          Coming later
        </span>
        <h1 style={{ marginTop: 12 }}>Import opportunity</h1>
        <p>
          Pasting a Telegram message and AI extraction will be built in a later step. For now, use{" "}
          <a href="/admin/opportunities/import" style={{ color: "var(--color-brand)", fontWeight: 650 }}>
            Bulk Import
          </a>{" "}
          or{" "}
          <a href="/admin/opportunities/new" style={{ color: "var(--color-brand)", fontWeight: 650 }}>
            Add Opportunity
          </a>
          .
        </p>
      </main>
    </div>
  );
}
