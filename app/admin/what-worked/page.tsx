import Link from "next/link";
import WhatWorkedCard from "@/components/WhatWorkedCard";
import WhatWorkedForm from "@/components/admin/WhatWorkedForm";
import { getAllWhatWorkedForAdmin } from "@/lib/data/what-worked";

type SearchParams = { [key: string]: string | string[] | undefined };

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

// Admin-only manager for "What Worked For Me" (/what-worked). Only the admin
// adds and edits stories here; visitors can only read the public page.
// Add only real students' experiences, shared with their permission.
export default async function AdminWhatWorkedPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const error = first(params.error);
  const added = first(params.added) === "1";
  const updated = first(params.updated) === "1";
  const editId = first(params.edit);
  const stories = await getAllWhatWorkedForAdmin();
  const editing = editId ? stories.find((s) => s.id === editId) : undefined;

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
          Only you can add or edit these — visitors just read them. Add only real students&apos; experiences, shared
          with their permission.
        </p>
        {error && <p className="form-error">{error}</p>}
        {added && <p className="bulk-summary">Story added.</p>}
        {updated && <p className="bulk-summary">Saved.</p>}

        <section className="card" id="story-form" style={{ marginBottom: 32 }}>
          <h2>{editing ? `Edit story — ${editing.display_name}` : "Add a story"}</h2>
          {editing && (
            <p className="hint" style={{ marginTop: -4 }}>
              <Link href="/admin/what-worked">Cancel editing</Link>
            </p>
          )}
          <WhatWorkedForm key={editing?.id ?? "new"} story={editing} />
        </section>

        <h2 style={{ marginBottom: 12 }}>All stories ({stories.length})</h2>
        {stories.length === 0 ? (
          <p className="hint">No stories yet — add the first one above.</p>
        ) : (
          <div className="ww-grid">
            {stories.map((s) => (
              <div className="ww-admin-item" key={s.id}>
                <WhatWorkedCard story={s} />
                <p className="hint" style={{ margin: "8px 2px" }}>
                  {s.is_published ? "✅ Live" : "⏸ Hidden"} · {s.display_name}
                  {s.is_anonymous ? " (shown as Anonymous)" : ""} · {new Date(s.created_at).toLocaleDateString("en-IN")}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <Link className="btn btn-sm btn-primary" href={`/admin/what-worked?edit=${s.id}#story-form`}>
                    Edit
                  </Link>
                  <form action={`/api/admin/what-worked/${s.id}`} method="post">
                    <input name="action" type="hidden" value={s.is_published ? "unpublish" : "publish"} />
                    <button className="btn btn-sm btn-secondary" type="submit">
                      {s.is_published ? "Hide" : "Publish"}
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
      </main>
    </div>
  );
}
