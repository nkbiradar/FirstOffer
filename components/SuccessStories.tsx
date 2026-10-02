"use client";

import { useState } from "react";
import { avatarGradient, initials } from "@/lib/ui-format";
import type { Testimonial } from "@/types/supabase";

// Card grid for the homepage "Students Who Found Their Next Opportunity"
// section. Every row it renders comes straight from the `testimonials`
// table (see lib/data/testimonials.ts, app/admin/testimonials/page.tsx) —
// there is no local/fallback data here. The section that renders this
// component simply doesn't render at all until at least one real,
// published review exists, so there is never a placeholder card on the
// live site.
//
// Only the first INITIAL_COUNT cards show by default (keeps the homepage
// from turning into a long testimonial wall); a "View more" button reveals
// the rest in place. No pagination/routing involved on purpose.
const INITIAL_COUNT = 3;

export default function SuccessStories({ testimonials }: { testimonials: Testimonial[] }) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = testimonials.length > INITIAL_COUNT;
  const visible = expanded ? testimonials : testimonials.slice(0, INITIAL_COUNT);

  return (
    <>
      <div className="success-grid">
        {visible.map((testimonial) => {
          const { a, b } = avatarGradient(testimonial.student_name);
          const meta = [testimonial.college, testimonial.graduation_batch].filter(Boolean).join(" • ");
          const roleLine = [testimonial.role, testimonial.company_name].filter(Boolean).join(" at ");

          return (
            <article className="success-card" key={testimonial.id}>
              <div className="success-card-top">
                <span
                  className="success-avatar"
                  style={{ ["--avatar-a" as string]: a, ["--avatar-b" as string]: b }}
                >
                  {initials(testimonial.student_name)}
                </span>
                <div className="success-person">
                  <p className="success-name">{testimonial.student_name}</p>
                  {meta && <p className="success-meta">{meta}</p>}
                </div>
              </div>

              {roleLine && <p className="success-role">{roleLine}</p>}

              {testimonial.rating && (
                <div className="success-stars" aria-label={`${testimonial.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <span aria-hidden key={i} className={i < testimonial.rating! ? "star star-filled" : "star"}>
                      ★
                    </span>
                  ))}
                </div>
              )}

              {testimonial.quote && <p className="success-quote">{testimonial.quote}</p>}
            </article>
          );
        })}
      </div>

      {hasMore && (
        <div className="success-view-more">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "View less" : `View more (${testimonials.length - INITIAL_COUNT} more)`}
          </button>
        </div>
      )}
    </>
  );
}
