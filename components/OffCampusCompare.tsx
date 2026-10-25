import Link from "next/link";
import { getFullAccessPriceInr } from "@/lib/payments/razorpay";

// "Only campus placements vs Off-campus with FirstOffer" value comparison
// (homepage + /unlock). Points about campus placements are general limits
// students commonly face; FirstOffer numbers come from live site stats.

type Props = { totalStartups?: number; totalInterviews?: number };

export default function OffCampusCompare({ totalStartups = 0, totalInterviews = 0 }: Props) {
  const perDay = (getFullAccessPriceInr() / 90).toFixed(1);
  const startups = totalStartups > 0 ? `${totalStartups.toLocaleString("en-IN")}+` : "1,000+";

  const campus = [
    "Only the few companies that visit your campus",
    "Fixed drive dates — you wait for your turn",
    "Strict CGPA, branch & backlog cut-offs",
    "One-offer rule can block you after your first offer",
    "Hundreds of classmates competing for the same seats",
  ];
  const offCampus = [
    `${startups} startups & companies hiring freshers`,
    "Apply to many companies every day, in parallel",
    "Direct HR emails & Google Forms — no middlemen",
    "Roles open to any college, many to any branch",
    "Keep applying even after an offer — upgrade anytime",
  ];

  return (
    <section className="fp-compare" data-app-hide>
      <div className="fp-pricing-head">
        <span className="fp-eyebrow">Why off-campus</span>
        <h2>
          Campus placements are a start. <span>Not your only chance.</span>
        </h2>
        <p>Use FirstOffer side by side with campus drives — so you&apos;re never left with zero options.</p>
      </div>

      <div className="fp-compare-grid">
        <div className="fp-compare-card fp-compare-campus">
          <h3>Only campus placements</h3>
          <p className="fp-compare-sub">Good fundamentals, limited options.</p>
          <ul>
            {campus.map((t) => (
              <li key={t}>
                <svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" width="16">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
          <p className="fp-compare-tip">
            💡 <strong>Don&apos;t skip campus drives.</strong> Keep preparing for them — and apply off-campus every day
            alongside, so one missed drive never decides your career.
          </p>
        </div>

        <div className="fp-compare-card fp-compare-fo">
          <h3>
            <span aria-hidden="true" className="fp-spark">
              ✦
            </span>
            Off-campus with FirstOffer
          </h3>
          <p className="fp-compare-sub">Spend less time searching. More time getting interview calls.</p>
          <ul>
            {offCampus.map((t) => (
              <li key={t}>
                <svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24" width="16">
                  <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
          <div className="fp-perday">
            <div>
              <strong>One payment.</strong>
              <span>3 months of fresh opportunities.</span>
            </div>
            <div className="fp-perday-price">
              ₹{perDay}
              <small>/day</small>
            </div>
          </div>
          {totalInterviews > 0 && (
            <p className="fp-compare-proof">🎤 {totalInterviews} students have already landed interview calls this way.</p>
          )}
          <Link className="fp-cta fp-cta-primary" href="/unlock">
            Start applying off-campus
          </Link>
        </div>
      </div>
    </section>
  );
}
