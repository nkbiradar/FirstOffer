// UserReviewsSection — "Students Who Found Their Next Opportunity"
//
// Pure-CSS horizontal marquee carousel — identical scroll technique to
// TestimonialsMarquee (track rendered twice, -50% translateX loop).
// Pauses on hover, respects prefers-reduced-motion, edge-fades with a
// CSS mask. No client JS required.
//
// ⚠️  Cards are currently showing DEMO data (isSample: true).
//     Replace entries in lib/data/user-reviews.ts with real verified
//     submissions when collected.

import { avatarGradient, initials } from "@/lib/ui-format";
import type { UserReview } from "@/lib/data/user-reviews";

// ── Star rating ───────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="review-stars" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={
            i < rating ? "review-star review-star--filled" : "review-star review-star--empty"
          }
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </div>
  );
}

// ── Single review card ────────────────────────────────────────────────────

function ReviewCard({ review: r, ariaHidden }: { review: UserReview; ariaHidden?: boolean }) {
  const { a, b } = avatarGradient(r.name);

  return (
    <article
      className="review-card"
      style={{ ["--avatar-a" as string]: a, ["--avatar-b" as string]: b }}
      aria-hidden={ariaHidden}
    >
      {/* Quote ------------------------------------------------------------- */}
      <blockquote className="review-quote">
        <p>&ldquo;{r.review}&rdquo;</p>
      </blockquote>

      {/* Stars ------------------------------------------------------------- */}
      <StarRating rating={r.rating} />

      {/* Divider ----------------------------------------------------------- */}
      <hr className="review-divider" aria-hidden="true" />

      {/* Person ------------------------------------------------------------ */}
      <div className="review-person">
        <div className="review-avatar">
          {r.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="review-avatar-photo"
              src={r.photoUrl}
              alt={r.name}
              width={44}
              height={44}
            />
          ) : (
            <span className="review-avatar-initials">{initials(r.name)}</span>
          )}
        </div>
        <div className="review-person-info">
          <p className="review-person-name">{r.name}</p>
          <p className="review-person-college">
            {r.college}&nbsp;•&nbsp;{r.batch}
          </p>
        </div>
      </div>

      {/* Role chip --------------------------------------------------------- */}
      <div className="review-role-chip">
        <svg
          className="review-role-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
          width={13}
          height={13}
        >
          <path
            d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>
          {r.role} at {r.company}
        </span>
      </div>
    </article>
  );
}

// ── Section ───────────────────────────────────────────────────────────────

interface UserReviewsSectionProps {
  reviews: UserReview[];
}

export default function UserReviewsSection({ reviews }: UserReviewsSectionProps) {
  if (reviews.length === 0) return null;

  // Duplicate the track so the loop is seamless (same trick as TestimonialsMarquee)
  const track = [...reviews, ...reviews];

  return (
    <section className="section user-reviews-section" aria-labelledby="reviews-heading">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="section-header">
        <div>
          <span className="eyebrow">
            <span className="eyebrow-dot" />
            Student experiences
          </span>
          <h2 id="reviews-heading" style={{ marginTop: 10 }}>
            Students Who Found Their Next Opportunity
          </h2>
          <p className="section-sub">
            These are verified, user-submitted experiences. No placement guarantees are made.
          </p>
        </div>
      </div>

      {/* ── Marquee ────────────────────────────────────────────────────── */}
      <div className="review-marquee" aria-label="Student reviews carousel">
        <div
          className="review-track"
          style={{ ["--review-count" as string]: reviews.length }}
        >
          {track.map((r, index) => (
            <ReviewCard
              key={`${r.id}-${index}`}
              review={r}
              ariaHidden={index >= reviews.length}
            />
          ))}
        </div>
      </div>

      {/* ── Trust note ─────────────────────────────────────────────────── */}
      <p className="review-trust-note">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
          width={13}
          height={13}
          style={{ display: "inline", verticalAlign: "middle", marginRight: 5 }}
        >
          <path
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        All reviews are user-submitted. No placement guarantees are made.
      </p>
    </section>
  );
}
