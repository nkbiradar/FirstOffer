import Link from "next/link";
import CountUp from "@/components/CountUp";
import WhatsAppChannelLink from "@/components/WhatsAppChannelLink";
import WhatsAppHelpLine from "@/components/WhatsAppHelpLine";
import HiredCompanies from "@/components/HiredCompanies";
import type { Testimonial } from "@/types/supabase";

// Dark, animated top of the homepage: hero copy + a live "Today's openings"
// card (real newest listings), the milestone stats, and the "Built by
// members from" strip. Animations are CSS-only (see .dh-* in globals.css)
// and switch off for users who prefer reduced motion.

type Opening = {
  id: string;
  role: string;
  published_at: string | null;
  location: string | null;
  work_mode: string | null;
  opportunity_type: string | null;
  stipend: string | null;
  salary: string | null;
  company: { name: string | null; logo_url?: string | null } | { name: string | null; logo_url?: string | null }[] | null;
};

type Stats = {
  totalPostedEver: number;
  totalStartups: number;
  totalSubscribers: number;
  totalInterviews: number;
  totalOffers: number;
  totalOpportunities: number;
  totalCompanies: number;
};

type Props = {
  todayCount: number;
  dateLabel: string;
  stats: Stats;
  openings: Opening[];
  testimonials?: Testimonial[];
  companies?: { name: string; logo_url: string | null; website: string | null }[];
};

function companyOf(o: Opening) {
  const c = Array.isArray(o.company) ? o.company[0] : o.company;
  return c?.name ?? null;
}

function ago(iso: string | null) {
  if (!iso) return "";
  const mins = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function tagOf(o: Opening) {
  if (o.opportunity_type === "internship") return "Internship";
  if (o.work_mode === "remote") return "Remote";
  if (o.opportunity_type === "full_time") return "Full-time";
  return "Fresher";
}

const AVATAR_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ec4899", "#14b8a6"];

export default function HomeDarkHero({ todayCount, dateLabel, stats, openings, testimonials = [], companies = [] }: Props) {
  const rows = openings.slice(0, 5);
  const milestones = [
    { value: stats.totalPostedEver, plus: false, label: "Opportunities posted" },
    { value: stats.totalStartups, plus: false, label: "Startups hiring freshers" },
    { value: stats.totalSubscribers, plus: false, label: "Students joined" },
    { value: stats.totalInterviews, plus: false, label: "Interview calls" },
    { value: stats.totalOffers, plus: false, label: "Offers received" },
  ];

  return (
    <div className="dh">
      <div aria-hidden="true" className="dh-glow dh-glow-1" />
      <div aria-hidden="true" className="dh-glow dh-glow-2" />
      <div aria-hidden="true" className="dh-grid-bg" />

      <section className="dh-hero">
        <div className="container dh-hero-inner">
          <div className="dh-copy">
            <span className="dh-badge dh-in" style={{ animationDelay: "0.05s" }}>
              <span className="dh-live-dot" />
              {stats.totalSubscribers.toLocaleString("en-IN")} students · {todayCount > 0 ? `${todayCount} new today` : `updated ${dateLabel}`}
            </span>

            <h1 className="dh-in" style={{ animationDelay: "0.12s" }}>
              Find Your{" "}
              <span className="dh-swoosh">
                First Offer
                <svg aria-hidden="true" fill="none" viewBox="0 0 320 24">
                  <path d="M4 15c48-12 240-16 312 3" stroke="url(#dhSwoosh)" strokeLinecap="round" strokeWidth="5" />
                  <defs>
                    <linearGradient id="dhSwoosh" x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0" stopColor="#3b82f6" />
                      <stop offset="1" stopColor="#34d399" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              <br />
              Faster.
            </h1>

            <p className="dh-sub dh-in" style={{ animationDelay: "0.2s" }}>
              Fresher jobs, internships and off-campus drives from companies hiring across India — with the HR&apos;s
              email, Google Form or official apply link.
            </p>
            <p className="dh-note dh-in" style={{ animationDelay: "0.26s" }}>
              ⏱ Every listing expires in 2 days as companies close hiring — apply fast.
            </p>

            <div className="dh-actions dh-in" style={{ animationDelay: "0.32s" }}>
              <Link className="dh-btn dh-btn-dark" href="/fresher-jobs">
                Find Fresher Jobs
              </Link>
              <Link className="dh-btn dh-btn-blue" href="/tech-jobs">
                Browse Tech Jobs <span aria-hidden="true">→</span>
              </Link>
            </div>

            <ul className="dh-points dh-in" style={{ animationDelay: "0.36s" }}>
              <li>
                <span aria-hidden="true">⏱</span> Live for 48 hours, then gone — no closed roles
              </li>
              <li>
                <span aria-hidden="true">↗</span> Straight to the source — no middlemen
              </li>
              <li>
                <span aria-hidden="true">👁</span> Browse free, forever — sign in with Google for full details
              </li>
            </ul>

            <div className="dh-links dh-in" style={{ animationDelay: "0.42s" }}>
              <WhatsAppChannelLink />
              <WhatsAppHelpLine />
            </div>
          </div>

          <div className="dh-card-wrap dh-in" style={{ animationDelay: "0.25s" }}>
            <div className="dh-card">
              <div className="dh-card-top">
                <div>
                  <p className="dh-card-title">Today&apos;s openings</p>
                  <p className="dh-card-sub">
                    {stats.totalOpportunities} live · {stats.totalCompanies} companies hiring
                  </p>
                </div>
                <span className="dh-card-count">
                  <span className="dh-live-dot" />
                  {todayCount} new
                </span>
              </div>

              <ul className="dh-list">
                {rows.length === 0 && <li className="dh-empty">New openings are added every day — check back soon.</li>}
                {rows.map((o, i) => {
                  const company = companyOf(o) ?? "Hiring now";
                  return (
                    <li key={o.id} style={{ animationDelay: `${0.45 + i * 0.12}s` }}>
                      <Link href={`/opportunities/${o.id}`}>
                        <span aria-hidden="true" className="dh-avatar" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                          {company.charAt(0).toUpperCase()}
                        </span>
                        <span className="dh-row-main">
                          <span className="dh-role">{o.role}</span>
                          <span className="dh-meta">
                            {company}
                            {o.location ? ` · ${o.location}` : ""}
                          </span>
                        </span>
                        <span className="dh-row-side">
                          <span className="dh-tag">{tagOf(o)}</span>
                          <span className="dh-ago">{ago(o.published_at)}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <Link className="dh-card-more" href="/opportunities">
                View all openings <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="dh-stats">
        <div className="container">
          <div className="dh-stats-row">
            {milestones.map((m) => (
              <div className="dh-stat" key={m.label}>
                <span className="dh-stat-value">
                  <CountUp value={m.value} />
                  {m.plus ? "+" : ""}
                </span>
                <span className="dh-stat-label">{m.label}</span>
              </div>
            ))}
          </div>
          {stats.totalInterviews > 0 && (
            <p className="dh-next">
              🎯 {stats.totalInterviews} students have landed interview calls through FirstOffer.{" "}
              <strong>Your first call could be #{stats.totalInterviews + 1}.</strong>
            </p>
          )}
          <p className="dh-truth">
            You don&apos;t need more skills. <span>You need your resume to reach a real HR.</span>
          </p>
        </div>
      </section>

      <HiredCompanies companies={companies} testimonials={testimonials} />

      <section className="dh-built">
        <div className="container">
          <p className="dh-built-label">Built by members from</p>
          <div className="dh-built-row">
            {[
              ["/images/logos/iiit-dharwad.jpg", "IIIT Dharwad"],
              ["/images/logos/iit-bombay.webp", "IIT Bombay"],
              ["/images/logos/iit-madras.jpg", "IIT Madras"],
            ].map(([src, name]) => (
              <span className="dh-inst" key={name}>
                <span className="dh-inst-logo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="" src={src} />
                </span>
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
