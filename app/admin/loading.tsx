// Shown instantly when navigating to any /admin page, so the click feels
// responsive while the server loads the dashboard data.
export default function AdminLoading() {
  return (
    <div className="admin-shell">
      <main className="admin-page" aria-busy="true">
        <div className="admin-skel admin-skel-title" />
        <div className="admin-skel-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="admin-skel admin-skel-card" key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
