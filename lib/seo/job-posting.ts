import type { OpportunityWithCompany } from "@/lib/data/opportunities";
import { getSiteUrl } from "@/lib/site-url";

const EMPLOYMENT_TYPE: Record<string, string> = {
  internship: "INTERN",
  full_time: "FULL_TIME",
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function extractSalaryRange(text: string | null): { min: number; max: number; unit: "MONTH" | "YEAR" } | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  const isLpa = lower.includes("lpa") || lower.includes("per annum") || lower.includes("/year") || lower.includes("annual");
  const isMonthly = lower.includes("/month") || lower.includes("per month") || lower.includes("p.m.");

  // Check for LPA numbers like "6 LPA", "8 - 12 LPA", "3.5 LPA"
  const lpaMatches = text.match(/\b\d+(\.\d+)?\s*(?=lpa\b)/gi);
  if (lpaMatches && lpaMatches.length > 0) {
    const lpaVals = lpaMatches.map((val) => Number(val) * 100000).filter((n) => Number.isFinite(n) && n > 0);
    if (lpaVals.length > 0) {
      return {
        min: Math.min(...lpaVals),
        max: Math.max(...lpaVals),
        unit: "YEAR",
      };
    }
  }

  // Check for numbers like ₹25,000 or 25000
  const matches = text.match(/[\d,]{3,}/g);
  if (!matches || matches.length === 0) return null;
  const numbers = matches.map((m) => Number(m.replace(/,/g, ""))).filter((n) => Number.isFinite(n) && n > 0);
  if (numbers.length === 0) return null;

  return {
    min: Math.min(...numbers),
    max: Math.max(...numbers),
    unit: isLpa ? "YEAR" : isMonthly ? "MONTH" : "MONTH",
  };
}

function buildHtmlDescription(opportunity: OpportunityWithCompany, companyName: string): string {
  const parts: string[] = [];

  const roleDesc = [
    `<strong>Role:</strong> ${escapeHtml(opportunity.role)}`,
    `<strong>Company:</strong> ${escapeHtml(companyName)}`,
    opportunity.location ? `<strong>Location:</strong> ${escapeHtml(opportunity.location)}` : null,
    opportunity.work_mode ? `<strong>Work Mode:</strong> ${escapeHtml(opportunity.work_mode)}` : null,
    opportunity.batch.length > 0 ? `<strong>Eligible Batches:</strong> ${escapeHtml(opportunity.batch.join(", "))}` : null,
  ].filter(Boolean);

  parts.push(`<p>${roleDesc.join("<br/>")}</p>`);

  if (opportunity.eligibility) {
    parts.push(`<h3>Eligibility</h3><p>${escapeHtml(opportunity.eligibility)}</p>`);
  }

  if (opportunity.degree.length > 0 || opportunity.branches.length > 0) {
    const edu: string[] = [];
    if (opportunity.degree.length > 0) edu.push(`<strong>Degree:</strong> ${escapeHtml(opportunity.degree.join(", "))}`);
    if (opportunity.branches.length > 0) edu.push(`<strong>Branches:</strong> ${escapeHtml(opportunity.branches.join(", "))}`);
    parts.push(`<p>${edu.join("<br/>")}</p>`);
  }

  if (opportunity.skills.length > 0) {
    parts.push(`<h3>Key Skills</h3><p>${escapeHtml(opportunity.skills.join(", "))}</p>`);
  }

  if (opportunity.responsibilities.length > 0) {
    parts.push(
      `<h3>Responsibilities</h3><ul>${opportunity.responsibilities
        .map((r) => `<li>${escapeHtml(r)}</li>`)
        .join("")}</ul>`,
    );
  }

  if (opportunity.requirements.length > 0) {
    parts.push(
      `<h3>Requirements</h3><ul>${opportunity.requirements
        .map((r) => `<li>${escapeHtml(r)}</li>`)
        .join("")}</ul>`,
    );
  }

  if (opportunity.additional_details) {
    parts.push(`<h3>Additional Details</h3><p>${escapeHtml(opportunity.additional_details)}</p>`);
  }

  return parts.join("\n");
}

function toIsoValidThrough(deadline: string | null, expiresAt: string | null): string | undefined {
  if (deadline) {
    // deadline is yyyy-mm-dd
    return `${deadline}T23:59:59+05:30`;
  }
  if (expiresAt) {
    return new Date(expiresAt).toISOString();
  }
  return undefined;
}

/**
 * Valid JobPosting schema for Google for Jobs.
 * Uses real job data only. HTML description is generated for rich formatting.
 */
export function buildJobPostingJsonLd(opportunity: OpportunityWithCompany): Record<string, unknown> {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/opportunities/${opportunity.id}`;
  const companyName = opportunity.company?.name || "Hiring Company";
  const datePosted = opportunity.published_at ?? opportunity.created_at;
  const validThrough = toIsoValidThrough(opportunity.deadline, opportunity.expires_at);
  const salaryRange = extractSalaryRange(opportunity.stipend || opportunity.salary || null);
  const descriptionHtml = buildHtmlDescription(opportunity, companyName);

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: opportunity.role,
    description: descriptionHtml,
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
      sameAs: opportunity.company?.website || undefined,
      logo: opportunity.company?.logo_url || `${siteUrl}/images/brand-mark.png`,
    },
    experienceRequirements: {
      "@type": "OccupationalExperienceRequirements",
      monthsOfExperience: 0,
    },
    directApply: Boolean(opportunity.application_url),
    url,
  };

  if (opportunity.degree.length > 0) {
    jsonLd.educationRequirements = {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: opportunity.degree.join(", "),
    };
  }

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
        unitText: salaryRange.unit,
      },
    };
  }

  return jsonLd;
}

/**
 * BreadcrumbList schema for Google search results.
 */
export function buildJobBreadcrumbsJsonLd(
  opportunity: OpportunityWithCompany,
): Record<string, unknown> {
  const siteUrl = getSiteUrl();
  const companyName = opportunity.company?.name ?? "";
  const roleName = opportunity.role;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Fresher Jobs",
        item: `${siteUrl}/fresher-jobs`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: companyName ? `${roleName} at ${companyName}` : roleName,
        item: `${siteUrl}/opportunities/${opportunity.id}`,
      },
    ],
  };
}

/**
 * WebPage / BreadcrumbList schema for landing pages.
 */
export function buildLandingBreadcrumbsJsonLd(
  pageName: string,
  pagePath: string,
): Record<string, unknown> {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: pageName,
        item: `${siteUrl}${pagePath}`,
      },
    ],
  };
}
