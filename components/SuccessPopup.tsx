"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { initials } from "@/lib/ui-format";
import type { Testimonial } from "@/types/supabase";

// Timing for the rotation below — tuned to feel like a real-time feed
// without being distracting. All in milliseconds.
const INITIAL_DELAY_MS = 4000; // wait before the very first card shows
const VISIBLE_DURATION_MS = 7000; // how long each card stays up
const GAP_BETWEEN_MS = 9000; // pause between one card leaving and the next appearing

const OUTCOME_COPY: Record<Testimonial["outcome"], string> = {
  interview: "just got an interview call at",
  selected: "just got placed at",
};

/**
 * The small "Rahul just got an interview call at TCS" card that drifts up
 * from the bottom-left every so often — the same kind of live social-proof
 * widget most job/edtech sites run (Fomo, ProveSource, etc.), built here on
 * top of the same testimonials data that already powers the homepage
 * "Success Stories" grid (components/SuccessStories.tsx). Nothing new to
 * manage: whatever's added/published at /admin/testimonials shows up in
 * both places automatically.
 *
 * Fetched server-side once in app/layout.tsx (same pattern as the `user`
 * prop threaded into Navbar) and handed down here as plain data, so this
 * component only has to worry about timing and animation, not data
 * fetching. Hidden on /admin/* — an admin doesn't need to see the site's
 * own marketing widget while managing the site.
 */
export default function SuccessPopup({ testimonials }: { testimonials: Testimonial[] }) {
  const pathname = usePathname();
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAdminRoute = pathname?.startsWith("/admin");
  const hasTestimonials = testimonials.length > 0;

  useEffect(() => {
    if (isAdminRoute || !hasTestimonials) return;

    let cancelled = false;

    function showNext() {
      if (cancelled) return;
      setVisible(true);
      timerRef.current = setTimeout(() => {
        if (cancelled) return;
        setVisible(false);
        timerRef.current = setTimeout(() => {
          if (cancelled) return;
          setIndex((current) => (current + 1) % testimonials.length);
          showNext();
        }, GAP_BETWEEN_MS);
      }, VISIBLE_DURATION_MS);
    }

    timerRef.current = setTimeout(showNext, INITIAL_DELAY_MS);

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // testimonials.length only — a changing array reference on every render
    // (new server data on navigation) shouldn't restart the whole cycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdminRoute, hasTestimonials, testimonials.length]);

  function handleDismiss() {
    setVisible(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    // Skip ahead so the next card (not the one just dismissed) is what
    // eventually comes back, then resume the normal cycle.
    timerRef.current = setTimeout(() => {
      setIndex((current) => (current + 1) % testimonials.length);
      setVisible(true);
      timerRef.current = setTimeout(() => {
        setVisible(false);
      }, VISIBLE_DURATION_MS);
    }, GAP_BETWEEN_MS);
  }

  if (isAdminRoute || !hasTestimonials || !visible) return null;

  const testimonial = testimonials[index];
  const detail = [testimonial.college, testimonial.graduation_batch].filter(Boolean).join(" • ");

  return (
    <div className="success-popup" role="status" aria-live="polite">
      <button
        type="button"
        className="success-popup-close"
        onClick={handleDismiss}
        aria-label="Dismiss"
      >
        ×
      </button>
      <div className="success-popup-row">
        <div className={`success-popup-avatar success-popup-avatar-initials outcome-${testimonial.outcome}`}>
          {initials(testimonial.student_name)}
        </div>
        <div className="success-popup-body">
          <p className="success-popup-headline">
            <strong>{testimonial.student_name}</strong> {OUTCOME_COPY[testimonial.outcome]}{" "}
            <strong>{testimonial.company_name}</strong>
          </p>
          {detail && <p className="success-popup-detail">{detail}</p>}
          {testimonial.quote && <p className="success-popup-quote">&ldquo;{testimonial.quote}&rdquo;</p>}
        </div>
      </div>
    </div>
  );
}
