import BulkImportClient from "@/components/admin/BulkImportClient";

export default function BulkImportPage() {
  return (
    <div className="admin-shell">
      <main className="admin-page admin-page-wide">
        <div className="admin-page-header">
          <h1>Bulk Import Opportunities</h1>
        </div>
        <p className="hint">
          Paste 20–30 opportunities at once, one <code>---OPPORTUNITY---</code> / <code>---END---</code> block each,
          then Parse, review/edit each one below, and Publish All. Company names are matched to existing companies
          automatically (case-insensitive) or created if new — no separate company step needed.
        </p>
        <BulkImportClient />
      </main>
    </div>
  );
}
