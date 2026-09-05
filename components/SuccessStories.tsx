import { avatarGradient, initials } from "@/lib/ui-format";
import type { Testimonial } from "@/types/supabase";

// Card grid for the homepage "Students Who Found Their Next Opportunity"
// section. Every row it renders comes straight from the `testimonials`
// table (see lib/data/testimonials.ts, app/admin/testimonials/page.tsx) —
// there is no local/fallback data here. The section that renders this
// component simply doesn't render at all until at least one real,
// published review exists, so there is never a placeholder card on the
// live site.
export default function SuccessStories({ testimonials }: { testimonials: Testimonial[] }) {
  return (
    <div className="success-grid">
      {testimonials.map((testimonial) => {
        const { a, b } = avatarGradient(testimonial.student_name);
        const meta = [testimonial.college, testimonial.graduation_batch].filter(Boolean).join(" • ");
        const roleLine = [testimonial.role, testimonial.company_name].filter(Boolean).join(" at ");

        return (
          <article className="success-card" key={testimonial.id}>
            <div className="success-card-top">
              {testimonial.avatar_url ? (
                // Admin-entered photo URLs can point anywhere, so this
                // deliberately skips next/image's remote-host allowlist
                // rather than opening images.remotePatterns to "any host".
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={testimonial.student_name}
                  className="success-avatar success-avatar-photo"
                  height={48}
                  src={testimonial.avatar_url}
                  width={48}
                />
              ) : (
                <span
                  className="success-avatar"
                  style={{ ["--avatar-a" as string]: a, ["--avatar-b" as string]: b }}
                >
                  {initials(testimonial.student_name)}
                </span>
              )}
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

            {testimonial.quote && <p className="success-quote">&ldquo;{testimonial.quote}&rdquo;</p>}
          </article>
        );
      })}
    </div>
  );
}
