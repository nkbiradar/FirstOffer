"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Fades/slides a block in once it scrolls into view — pairs with the
// .reveal/.reveal-visible classes in app/globals.css. Purely presentational:
// wraps existing markup without changing any data fetching or behavior.
// Falls back to already-visible if IntersectionObserver isn't available
// (very old browsers) so content is never stuck hidden.
export default function Reveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Always start false — matching what the server renders (Node has no
  // IntersectionObserver, but reading that at init time here would differ
  // between SSR and the client's first render before hydration, which is
  // exactly the bug CountUp.tsx had before it was fixed). The no-JS/old-
  // browser fallback below now happens inside the client-only effect
  // instead of the render, so it can't cause a hydration mismatch.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    // threshold near 0 + no negative rootMargin: on short mobile viewports a
    // section taller than the screen (like a long opportunity grid) could
    // need an unrealistically large scroll before 12% of its *total* height
    // was ever inside a viewport already shrunk by -60px — so the observer
    // could simply never fire and the section stayed at opacity:0 forever,
    // which is exactly what "opportunities missing on mobile" turned out to
    // be. Firing as soon as even a sliver is visible avoids that entirely.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: "0px 0px 200px 0px" },
    );
    observer.observe(el);

    // Belt-and-suspenders: some in-app/older mobile WebViews (bank apps,
    // older Android browsers) have flaky IntersectionObserver behavior.
    // Never let that permanently hide real content — force it visible
    // shortly after mount regardless.
    const fallback = window.setTimeout(() => setVisible(true), 1200);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <div ref={ref} className={`reveal ${visible ? "reveal-visible" : ""} ${className}`.trim()}>
      {children}
    </div>
  );
}
