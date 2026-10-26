import Link from "next/link";
import OfferCountdown from "@/components/OfferCountdown";
import SafePay from "@/components/SafePay";
import { STUDENT_COUNT_LABEL } from "@/components/PlanTags";
import {
  FULL_ACCESS_SALE_END_LABEL,
  FULL_ACCESS_SALE_ENDS_AT,
  INTERNAL_PRICE_INR,
  MONTHLY_PRICE_INR,
  RESUME_REVIEW_MRP_INR,
  RESUME_REVIEW_PRICE_INR,
  getFullAccessPriceInr,
  getInternalPriceInr,
  isDasaraSaleActive,
  isFullAccessSaleActive,
} from "@/lib/payments/razorpay";

// Dark, three-plan pricing section on the homepage: Full Access (featured),
// Internal HR Openings and Resume Makeover. All prices come from
// lib/payments/razorpay.ts, so a sale switching on/off updates this too.
// Strike-through prices are only shown when the plan's REAL regular price
// is higher than what's charged today.

type Feature = { text: string; included?: boolean };

type Plan = {
  key: string;
  name: string;
  period: string;
  price: number;
  was?: number;
  featured?: boolean;
  countdownEndsAt?: string;
  cta: string;
  href: string;
  note?: string;
  features: Feature[];
};

function pctOff(price: number, was?: number) {
  return was && was > price ? Math.round((1 - price / was) * 100) : 0;
}

function Check({ included }: { included: boolean }) {
  return included ? (
    <svg aria-hidden="true" className="fp-ico fp-ico-yes" fill="none" height="16" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24" width="16">
      <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg aria-hidden="true" className="fp-ico fp-ico-no" fill="none" height="16" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" width="16">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

export default function PricingPlans({ hasFullAccess = false }: { hasFullAccess?: boolean }) {
  const fullSale = isFullAccessSaleActive();
  const internalSale = isDasaraSaleActive();

  const plans: Plan[] = [
    {
      key: "internal",
      name: "Internal HR",
      period: "3 months",
      price: getInternalPriceInr(),
      was: internalSale ? INTERNAL_PRICE_INR : undefined,
      cta: "Get Internal HR",
      href: "/internal-openings",
      features: [
        { text: "Openings shared directly by HRs" },
        { text: "Low-competition roles" },
        { text: "Early access to fresh roles" },
        { text: "6 Interview Question Kits (PDF)" },
        { text: "HR contacts on all public listings", included: false },
      ],
    },
    {
      key: "full",
      name: "Full Access",
      period: "3 months",
      price: getFullAccessPriceInr(),
      was: fullSale ? MONTHLY_PRICE_INR : undefined,
      featured: true,
      countdownEndsAt: fullSale ? FULL_ACCESS_SALE_ENDS_AT : undefined,
      cta: hasFullAccess ? "Your access is active ✓" : "Get Full Access",
      href: hasFullAccess ? "/dashboard" : "/unlock",
      note: fullSale ? `Offer price · ends ${FULL_ACCESS_SALE_END_LABEL}` : undefined,
      features: [
        { text: "Direct HR emails & recruiter numbers" },
        { text: "Official Google Forms & apply links" },
        { text: "New fresher roles added daily" },
        { text: "Resume Keyword Matcher" },
        { text: "Fresh listings only — every role live 48 hrs" },
      ],
    },
    {
      key: "resume",
      name: "Resume Makeover",
      period: "One-time",
      price: RESUME_REVIEW_PRICE_INR,
      was: RESUME_REVIEW_MRP_INR,
      cta: "Fix my resume",
      href: "/resume",
      features: [
        { text: "Rebuilt for your target role" },
        { text: "ATS-friendly format & keywords" },
        { text: "Reviewed by HR professionals" },
        { text: "Free ATS template included" },
        { text: "Job listings & HR contacts", included: false },
      ],
    },
  ];

  return (
    <section className="fp-pricing" data-app-hide id="pricing">
      <div className="fp-pricing-head">
        <span className="fp-eyebrow">Membership Pricing</span>
        <h2>
          Plans that get you <span>interview calls</span>
        </h2>
        <p>Join {STUDENT_COUNT_LABEL} students applying directly to HRs — one payment, no auto-debit.</p>
        <div className="fp-tags">
          <span className="fp-tag">
            <span aria-hidden="true" className="fp-tag-dot" />
            Peak hiring season
            <span className="fp-tag-sep" aria-hidden="true" />
            <span className="fp-tag-muted">
              {fullSale ? `Offer pricing until ${FULL_ACCESS_SALE_END_LABEL}` : "New roles added daily"}
            </span>
          </span>
        </div>
      </div>

      <div className="fp-grid">
        {plans.map((p) => {
          const off = pctOff(p.price, p.was);
          return (
            <article className={`fp-card${p.featured ? " fp-card-featured" : ""}`} key={p.key}>
              {p.featured && <div className="fp-ribbon">Most popular</div>}
              <div className="fp-card-body">
                <h3 className="fp-name">
                  <span aria-hidden="true" className="fp-spark">
                    ✦
                  </span>
                  {p.name}
                </h3>
                <span className="fp-period">{p.period}</span>

                <div className="fp-price">₹{p.price.toLocaleString("en-IN")}</div>
                <div className="fp-was-row">
                  {off > 0 ? (
                    <>
                      <s>₹{p.was?.toLocaleString("en-IN")}</s>
                      <span className="fp-off">{off}% OFF</span>
                    </>
                  ) : (
                    <span className="fp-was-spacer">Best value for freshers</span>
                  )}
                </div>
                {p.note && <p className="fp-note">{p.note}</p>}

                {p.countdownEndsAt ? <OfferCountdown endsAt={p.countdownEndsAt} /> : <div className="fp-countdown-gap" />}

                <Link className={`fp-cta${p.featured ? " fp-cta-primary" : ""}`} href={p.href}>
                  {p.cta}
                </Link>

                <ul className="fp-features">
                  {p.features.map((f) => (
                    <li className={f.included === false ? "is-off" : undefined} key={f.text}>
                      <Check included={f.included !== false} />
                      {f.text}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}
      </div>

      <div className="fp-foot">
        <p className="fp-share">
          ⚠️ <strong>One account = one user, one device.</strong> Sharing your account or copying opportunities to others
          gets it <strong>banned</strong> — no refund.
        </p>
        <SafePay />
      </div>
    </section>
  );
}
