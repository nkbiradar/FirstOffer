import { avatarGradient, initials } from "@/lib/ui-format";
import type { Testimonial } from "@/types/supabase";

const OUTCOME_LABELS: Record<string, string> = {
  interview: "Interview call",
  selected: "Selected",
};

// Pure CSS marquee — no client JS. The list is rendered twice back to back
// and the track scrolls by exactly -50% of its own width on a linear loop,
// so the moment the first copy scrolls fully offscreen the second copy is
// sitting in the exact same spot: a seamless, gapless loop regardless of
// how many testimonials there are (see .testimonial-track in globals.css).
// Every card here is real — see supabase/schema.sql's comment on the
// testimonials table and /admin/testimonials, the only way a row gets in.
export default function TestimonialsMarquee({ testimonials }: { testimonials: Testimonial[] }) {
  const track = [...testimonials, ...testimonials];

  return (
    <div className="testimonial-marquee">
      <div
        className="testimonial-track"
        style={{ ["--testimonial-count" as string]: testimonials.length }}
      >
        {track.map((testimonial, index) => {
          const { a, b } = avatarGradient(testimonial.student_name);
          return (
            <div
              className="testimonial-card"
              key={`${testimonial.id}-${index}`}
              style={{ ["--avatar-a" as string]: a, ["--avatar-b" as string]: b }}
              aria-hidden={index >= testimonials.length}
            >
              <span className="testimonial-outcome-badge">
                {OUTCOME_LABELS[testimonial.outcome] ?? "Interview call"}
              </span>
              {testimonial.quote && <p className="testimonial-quote">&ldquo;{testimonial.quote}&rdquo;</p>}
              <div className="testimonial-person">
                <span className="testimonial-avatar">{initials(testimonial.student_name)}</span>
                <div>
                  <p className="testimonial-name">{testimonial.student_name}</p>
                  <p className="testimonial-meta">
                    {testimonial.role ? `${testimonial.role} · ` : ""}
                    {testimonial.company_name}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
