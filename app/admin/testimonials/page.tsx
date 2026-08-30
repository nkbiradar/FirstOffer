import { getAllTestimonialsForAdmin } from "@/lib/data/testimonials";
import DeleteTestimonialButton from "@/components/admin/DeleteTestimonialButton";

type SearchParams = { [key: string]: string | string[] | undefined };

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const OUTCOME_LABELS: Record<string, string> = {
  interview: "Got an interview call",
  selected: "Got selected",
};

// Every row here is a real student's real outcome — this page is the only
// way one gets onto the homepage's "Success stories" carousel (see
// components/TestimonialsMarquee.tsx), and there's deliberately no bulk-add
// or seed path. Add them one at a time as students actually report back.
export default async function AdminTestimonialsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const errorMessage = firstValue(params.error);
  const added = firstValue(params.added) === "1";
  const updated = firstValue(params.updated) === "1";
  const testimonials = await getAllTestimonialsForAdmin();

  return (
    <div className="admin-shell">
      <main className="admin-page admin-page-wide">
        <div className="admin-page-header">
          <h1>Testimonials</h1>
        </div>
        <p className="hint" style={{ marginTop: -8, marginBottom: 24 }}>
          Shown as a sliding carousel on the homepage when published. Only add real students with
          real outcomes — this is the site&apos;s proof that it actually works, so it only works if
          it&apos;s true.
        </p>

        {errorMessage && <p className="form-error">{errorMessage}</p>}
        {added && <p className="bulk-summary">Testimonial added.</p>}
        {updated && <p className="bulk-summary">Testimonial updated.</p>}

        <section className="card" style={{ marginBottom: 32 }}>
          <h2>Add a testimonial</h2>
          <form method="post" action="/api/admin/testimonials">
            <div className="form-grid-2">
              <label>
                Student Name
                <input name="student_name" type="text" placeholder="e.g. Priya Sharma" required />
              </label>
              <label>
                Company
                <input name="company_name" type="text" placeholder="e.g. Zomato" required />
              </label>
            </div>
            <div className="form-grid-2">
              <label>
                Role <span className="hint">(optional)</span>
                <input name="role" type="text" placeholder="e.g. SDE Intern" />
              </label>
              <label>
                Outcome
                <select name="outcome" defaultValue="interview">
                  <option value="interview">Got an interview call</option>
                  <option value="selected">Got selected</option>
                </select>
              </label>
            </div>
            <label>
              Quote <span className="hint">(optional — a short sentence in their own words)</span>
              <textarea
                name="quote"
                rows={2}
                placeholder="e.g. FirstOffer got me an interview within a week of applying."
              />
            </label>
            <button className="btn btn-primary" type="submit" style={{ marginTop: 12 }}>
              Add Testimonial
            </button>
          </form>
        </section>

        {testimonials.length === 0 ? (
          <div className="empty-state">
            <h3>No testimonials yet</h3>
            <p>The homepage carousel stays hidden until at least one is added here.</p>
          </div>
        ) : (
          <div className="bulk-items">
            {testimonials.map((testimonial) => (
              <div className="card" key={testimonial.id}>
                <div className="form-grid-2" style={{ alignItems: "start" }}>
                  <div>
                    <strong>{testimonial.student_name}</strong>
                    <p className="hint" style={{ margin: "2px 0 0" }}>
                      {testimonial.role ? `${testimonial.role} at ` : ""}
                      {testimonial.company_name} — {OUTCOME_LABELS[testimonial.outcome]}
                    </p>
                    {testimonial.quote && (
                      <p style={{ marginTop: 8, fontSize: 14 }}>&ldquo;{testimonial.quote}&rdquo;</p>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "start" }}>
                    <form method="post" action={`/api/admin/testimonials/${testimonial.id}`}>
                      <input type="hidden" name="is_published" value={(!testimonial.is_published).toString()} />
                      <button className="btn btn-secondary btn-sm" type="submit">
                        {testimonial.is_published ? "Unpublish" : "Publish"}
                      </button>
                    </form>
                    <DeleteTestimonialButton id={testimonial.id} studentName={testimonial.student_name} />
                  </div>
                </div>
                {!testimonial.is_published && <p className="hint" style={{ marginTop: 8 }}>Draft — not shown on the homepage.</p>}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
