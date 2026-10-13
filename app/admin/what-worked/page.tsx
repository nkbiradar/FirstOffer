import Link from "next/link";
import WhatWorkedCard from "@/components/WhatWorkedCard";
import { getAllWhatWorkedForAdmin } from "@/lib/data/what-worked";

type SearchParams = { [key: string]: string | string[] | undefined };

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

// Review queue for "What Worked For Me" stories (/what-worked). Drafts come
// from /what-worked/share; publish only real, specific, helpful ones.
export default async function AdminWhatWorkedPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const error = first(params.error);
  const updated = first(params.updated) === "1";
  const stories = await getAllWhatWorkedForAdmin();
  const drafts = stories.filter((s) => !s.is_published);
  const live = stories.filter((s) => s.is_published);

  const section = (title: string, list: typeof stories) => (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ marginBottom: 12 }}>
        {title} ({list.length})
      </h2>
      {list.length === 0 ? (
        <p className="hint">Nothing here.</p>
      ) : (
        <div className="ww-grid">
          {list.map((s) => (
            <div className="ww-admin-item" key={s.id}>
              <WhatWorkedCard story={s} />
              <p className="hint" style={{ margin: "8px 2px" }}>
                {s.display_name} · {s.submitter_email ?? "no email"} · {new Date(s.created_at).toLocaleDateString("en-IN")}
                {s.is_anonymous ? " · wants anonymous" : ""}
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <form action={`/api/admin/what-worked/${s.id}`} method="post">
                  <input name="action" type="hidden" value={s.is_published ? "unpublish" : "publish"} />
                  <button className={`btn btn-sm ${s.is_published ? "btn-secondary" : "btn-primary"}`} type="submit">
                    {s.is_published ? "Unpublish" : "Publish"}
                  </button>
                </form>
                <form action={`/api/admin/what-worked/${s.id}`} method="post">
                  <input name="action" type="hidden" value="delete" />
                  <button className="btn btn-sm btn-secondary" type="submit">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="admin-shell">
      <main className="admin-page admin-page-wide">
        <div className="admin-page-header">
          <h1>What Worked For Me</h1>
          <Link className="btn btn-secondary btn-sm" href="/what-worked">
            View public page
          </Link>
        </div>
        <p className="hint" style={{ marginTop: -8, marginBottom: 24 }}>
          Students submit these at /what-worked/share. Publish only real, specific stories — they&apos;re free advice
          other freshers will act on.
        </p>
        {error && <p className="form-error">{error}</p>}
        {updated && <p className="bulk-summary">Saved.</p>}
        {section("Waiting for review", drafts)}
        {section("Live on the site", live)}
      </main>
    </div>
  );
}
