import type { OpportunityWithCompany } from "@/lib/data/opportunities";
import { getSiteUrl } from "@/lib/site-url";

// Google's "Google for Jobs" feature — the single biggest SEO lever for a
// job board — only surfaces a listing if the page carries valid JobPosting
// structured data (schema.org). This builds that JSON-LD object from a
// real opportunity row. See app/opportunities/[id]/page.tsx for where it's
// rendered as a <script type="application/ld+json"> tag.

const EMPLOYMENT_TYPE: Record<string, string> = {
  internship: "INTERN",
  full_time: "FULL_TIME",
};

// stipend/salary are free-text fields ("₹20,000 - ₹25,000/month", "As per
// industry standards", ...) — Google's spec wants a real number for
// baseSalary, and wrong structured data is worse than none, so this only
// returns a range when the text confidently contains clean numbers.
function extractSalaryRange(text: string | null): { min: number; max: number } | null {
  if (!text) return null;
  const matches = text.match(/[\d,]{3,}/g);
  if (!matches || matches.length === 0) return null;
  const numbers = matches.map((m) => Number(m.replace(/,/g, ""))).filter((n) => Number.isFinite(n) && n > 0);
  if (numbers.length === 0) return null;
  return { min: Math.min(...numbers), max: Math.max(...numbers) };
}

export function buildJobPostingJsonLd(opportunity: OpportunityWithCompany): Record<string, unknown> {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/opportunities/${opportunity.id}`;
  const companyName = opportunity.company?.name || "A company hiring on FirstOffer";

  const descriptionParts = [
    opportunity.eligibility,
    opportunity.responsibilities.length > 0 ? `Responsibilities: ${opportunity.responsibilities.join("; ")}.` : null,
    opportunity.requirements.length > 0 ? `Requirements: ${opportunity.requirements.join("; ")}.` : null,
    opportunity.skills.length > 0 ? `Skills: ${opportunity.skills.join(", ")}.` : null,
    opportunity.additional_details,
  ].filter(Boolean);
  const description =
    descriptionParts.length > 0
      ? descriptionParts.join(" ")
      : `${opportunity.role} opening at ${companyName}, listed on FirstOffer for freshers.`;

  const datePosted = opportunity.published_at ?? opportunity.created_at;
  const validThrough = opportunity.deadline ?? opportunity.expires_at ?? undefined;
  const salaryRange = extractSalaryRange(opportunity.stipend || opportunity.salary || null);

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: opportunity.role,
    description,
    identifier: {
      "@type": "PropertyValue",
      name: "FirstOffer",
      value: opportunity.id,
    },
    datePosted,
    validThrough,
    employmentType: opportunity.opportunity_type ? EMPLOYMENT_TYPE[opportunity.opportunity_type] : undefined,
    hiringOrganization: {
      "@type": "Organization",
      name: companyName,
      logo: opportunity.company?.logo_url || `${siteUrl}/images/brand-mark.png`,
    },
    directApply: false,
    url,
  };

  if (opportunity.work_mode === "remote") {
    jsonLd.jobLocationType = "TELECOMMUTE";
    jsonLd.applicantLocationRequirements = {
      "@type": "Country",
      name: "India",
    };
  } else {
    jsonLd.jobLocation = {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: opportunity.location || "India",
        addressCountry: "IN",
      },
    };
  }

  if (salaryRange) {
    jsonLd.baseSalary = {
      "@type": "MonetaryAmount",
      currency: "INR",
      value: {
        "@type": "QuantitativeValue",
        minValue: salaryRange.min,
        maxValue: salaryRange.max,
        unitText: "MONTH",
      },
    };
  }

  return jsonLd;
}
