import { FEATURED_TESTIMONIALS } from "@/lib/content/featured-testimonials";

// "What worked for them" — real student stories next to the pay button.
export default function WhatWorked({ limit = 3 }: { limit?: number }) {
  const items = FEATURED_TESTIMONIALS.slice(0, limit);
  if (items.length === 0) return null;
  return (
    <section className="what-worked" aria-labelledby="what-worked-title">
      <h2 id="what-worked-title">💬 What worked for them</h2>
      <div className="what-worked-list">
        {items.map((t) => (
          <figure className="what-worked-card" key={`${t.name}-${t.company}`}>
            <div className="what-worked-head">
              <span className="what-worked-avatar" aria-hidden="true">
                {t.name.charAt(0).toUpperCase()}
              </span>
              <div>
                <strong>{t.name}</strong>
                <span className="what-worked-meta">
                  {[t.college, t.batch && `${t.batch} batch`].filter(Boolean).join(" · ")}
                </span>
              </div>
              <span className={`what-worked-badge ${t.result === "selected" ? "is-selected" : ""}`}>
                {t.result === "selected" ? "🏆 Selected" : "🎤 Interview call"}
              </span>
            </div>
            <blockquote>“{t.quote}”</blockquote>
            <figcaption>
              {t.role} @ <b>{t.company}</b>
              {t.timeTaken && <> · ⚡ in {t.timeTaken}</>}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
