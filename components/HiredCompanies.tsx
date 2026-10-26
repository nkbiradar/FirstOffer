import type { Testimonial } from "@/types/supabase";
import { localLogoFor } from "@/lib/content/company-logos";

// "Our students got interview calls & offers at…" — a slow, infinite logo
// marquee built ONLY from published testimonials (real students, added at
// /admin/testimonials). Only companies with a logo in
// public/images/company-logos (see lib/content/company-logos.ts) are shown.

type CompanyLite = { name: string; logo_url: string | null; website: string | null };

type Hired = { key: string; name: string; logo: string | null; interviews: number; offers: number };

const norm = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "");


const TILE_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ec4899", "#14b8a6", "#ef4444", "#6366f1"];

function buildList(testimonials: Testimonial[]): Hired[] {
  const out = new Map<string, Hired>();
  for (const t of testimonials) {
    const raw = (t.company_name ?? "").trim();
    if (!raw) continue;
    const slug = norm(raw);
    if (!slug) continue;
    const logo = localLogoFor(slug);
    // Group by logo file, so different spellings ("Delloite" / "Deloitte")
    // show the company only once.
    const key = logo ?? slug;
    let row = out.get(key);
    if (!row) {
      row = { key, name: raw, logo, interviews: 0, offers: 0 };
      out.set(key, row);
    }
    if (t.outcome === "selected") row.offers += 1;
    else row.interviews += 1;
  }
  return [...out.values()].sort((a, b) => Number(Boolean(b.logo)) - Number(Boolean(a.logo)) || b.offers - a.offers || b.interviews + b.offers - (a.interviews + a.offers));
}

function Chip({ c, i, hidden }: { c: Hired; i: number; hidden?: boolean }) {
  // With a logo: just the logo tile (the logo already shows the name).
  if (c.logo) {
    return (
      <span aria-hidden={hidden || undefined} className="hc-chip hc-chip-logo" title={c.name}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={hidden ? "" : c.name} className="hc-wordmark" loading="lazy" src={c.logo} />
      </span>
    );
  }
  return (
    <span aria-hidden={hidden || undefined} className="hc-chip">
      <span className="hc-logo hc-letter" style={{ background: TILE_COLORS[i % TILE_COLORS.length] }}>
        {c.name.charAt(0).toUpperCase()}
      </span>
      <span className="hc-name">{c.name}</span>
    </span>
  );
}

function Row({ items, reverse, offset }: { items: Hired[]; reverse?: boolean; offset: number }) {
  if (items.length === 0) return null;
  // Repeat short lists so one copy is always wider than the screen.
  const base = items.length < 8 ? [...items, ...items, ...items] : items;
  return (
    <div className="hc-row">
      <div
        className={`hc-track${reverse ? " hc-reverse" : ""}`}
        style={{ ["--hc-duration" as string]: `${Math.max(30, base.length * 4)}s` }}
      >
        {base.map((c, i) => (
          <Chip c={c} hidden={i >= items.length} i={i + offset} key={`a-${c.key}-${i}`} />
        ))}
        {base.map((c, i) => (
          <Chip c={c} hidden i={i + offset} key={`b-${c.key}-${i}`} />
        ))}
      </div>
    </div>
  );
}

export default function HiredCompanies({
  testimonials,
}: {
  testimonials: Testimonial[];
  /** Kept for the caller's API; logos now come from the local folder only. */
  companies?: CompanyLite[];
}) {
  // Only companies we have a logo for (public/images/company-logos).
  const list = buildList(testimonials).filter((c) => c.logo);
  if (list.length === 0) return null;
  const twoRows = list.length >= 12;
  const rowA = twoRows ? list.filter((_, i) => i % 2 === 0) : list;
  const rowB = twoRows ? list.filter((_, i) => i % 2 === 1) : [];

  return (
    <section className="hc" aria-label="Companies where FirstOffer students got interview calls and offers">
      <div className="container">
        <p className="hc-title">Our students got interview calls &amp; offers at</p>
      </div>
      <Row items={rowA} offset={0} />
      {twoRows && <Row items={rowB} offset={3} reverse />}
    </section>
  );
}
