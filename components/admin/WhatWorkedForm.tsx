import { APPLICATION_RANGES, type WhatWorkedStory } from "@/lib/data/what-worked";

// Admin-only add / edit form for "What Worked For Me" stories.
// New story → POST /api/admin/what-worked; edit → POST /api/admin/what-worked/[id] (action=update).
export default function WhatWorkedForm({ story }: { story?: WhatWorkedStory }) {
  const s = story;
  return (
    <form action={s ? `/api/admin/what-worked/${s.id}` : "/api/admin/what-worked"} method="post">
      {s && <input name="action" type="hidden" value="update" />}
      <div className="form-grid-2">
        <label>
          Student name *
          <input defaultValue={s?.display_name ?? ""} maxLength={80} name="display_name" required />
        </label>
        <label>
          College
          <input defaultValue={s?.college ?? ""} maxLength={120} name="college" placeholder="e.g. NMIT" />
        </label>
      </div>
      <div className="form-grid-2">
        <label>
          Graduation batch
          <input defaultValue={s?.graduation_batch ?? ""} maxLength={10} name="graduation_batch" placeholder="e.g. 2025" />
        </label>
        <label>
          Role they were applying for
          <input defaultValue={s?.target_role ?? ""} maxLength={100} name="target_role" placeholder="e.g. Software Engineer" />
        </label>
      </div>
      <label>
        Applications before things changed
        <select defaultValue={s?.applications_before ?? "50–100"} name="applications_before">
          {APPLICATION_RANGES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>
      <label>
        What wasn&apos;t working
        <textarea defaultValue={s?.what_wasnt_working ?? ""} maxLength={600} name="what_wasnt_working" rows={3} />
      </label>
      <label>
        What they changed * <span className="hint">(one change per line)</span>
        <textarea defaultValue={s?.what_changed ?? ""} maxLength={1200} name="what_changed" required rows={5} />
      </label>
      <label>
        Result *
        <input defaultValue={s?.result ?? ""} maxLength={300} name="result" placeholder="e.g. Got 3 interview calls in 2 weeks" required />
      </label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px", margin: "8px 0 14px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, flexDirection: "row" }}>
          <input defaultChecked={s?.is_anonymous ?? false} name="is_anonymous" style={{ width: "auto" }} type="checkbox" />
          Show as Anonymous (hide name and college)
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, flexDirection: "row" }}>
          <input defaultChecked={s?.is_published ?? true} name="is_published" style={{ width: "auto" }} type="checkbox" />
          Published (visible on the site)
        </label>
      </div>
      <button className="btn btn-primary" type="submit">
        {s ? "Save changes" : "Add story"}
      </button>
    </form>
  );
}
