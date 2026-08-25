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
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${visible ? "reveal-visible" : ""} ${className}`.trim()}>
      {children}
    </div>
  );
}
