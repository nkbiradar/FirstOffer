import { describe, expect, it } from "vitest";
import {
  normalizeType,
  normalizeWorkMode,
  parseBulkOpportunities,
} from "./bulk-import-parse";

describe("normalizeType", () => {
  it("recognizes internship variants", () => {
    expect(normalizeType("Internship")).toBe("internship");
    expect(normalizeType("intern")).toBe("internship");
  });

  it("recognizes full-time variants", () => {
    expect(normalizeType("Full-Time")).toBe("full_time");
    expect(normalizeType("full time")).toBe("full_time");
    expect(normalizeType("fulltime")).toBe("full_time");
  });

  it("returns empty string for anything unrecognized", () => {
    expect(normalizeType("contract")).toBe("");
    expect(normalizeType("")).toBe("");
  });
});

describe("normalizeWorkMode", () => {
  it("recognizes remote and hybrid directly", () => {
    expect(normalizeWorkMode("Remote")).toBe("remote");
    expect(normalizeWorkMode("Hybrid")).toBe("hybrid");
  });

  it("recognizes onsite variants", () => {
    expect(normalizeWorkMode("on-site")).toBe("onsite");
    expect(normalizeWorkMode("Work From Office")).toBe("onsite");
    expect(normalizeWorkMode("WFO")).toBe("onsite");
  });

  it("returns empty string for anything unrecognized", () => {
    expect(normalizeWorkMode("flexible")).toBe("");
  });
});

describe("parseBulkOpportunities", () => {
  it("parses a single ---OPPORTUNITY--- block into its fields", () => {
    const raw = `
---OPPORTUNITY---
Company: Acme Corp
Role: SDE Intern
Type: Internship
Batch: 2026
Location: Bengaluru
Work Mode: Remote
Skills: React, TypeScript
HR Email: hr@acme.example
---END---
`;
    const [draft] = parseBulkOpportunities(raw);

    expect(draft.company).toBe("Acme Corp");
    expect(draft.role).toBe("SDE Intern");
    expect(draft.opportunityType).toBe("internship");
    expect(draft.batch).toBe("2026");
    expect(draft.location).toBe("Bengaluru");
    expect(draft.workMode).toBe("remote");
    expect(draft.skills).toBe("React, TypeScript");
    expect(draft.hrEmail).toBe("hr@acme.example");
    expect(draft.sourceText).toContain("Company: Acme Corp");
  });

  it("splits multiple ---OPPORTUNITY--- blocks into separate drafts", () => {
    const raw = `
---OPPORTUNITY---
Company: Acme Corp
Role: SDE Intern
---END---
---OPPORTUNITY---
Company: Globex
Role: PM Intern
---END---
`;
    const drafts = parseBulkOpportunities(raw);

    expect(drafts).toHaveLength(2);
    expect(drafts[0].company).toBe("Acme Corp");
    expect(drafts[1].company).toBe("Globex");
  });

  it("falls back to blank-line splitting when no ---OPPORTUNITY--- marker is present", () => {
    const raw = `Company: Acme Corp\nRole: SDE Intern\n\nCompany: Globex\nRole: PM Intern`;

    const drafts = parseBulkOpportunities(raw);

    expect(drafts).toHaveLength(2);
    expect(drafts[0].company).toBe("Acme Corp");
    expect(drafts[1].company).toBe("Globex");
  });

  it("continues a multi-line field until the next recognized label", () => {
    const raw = `
---OPPORTUNITY---
Company: Acme Corp
Responsibilities: Ship features
Fix bugs
Review PRs
Requirements: 2+ years experience
---END---
`;
    const [draft] = parseBulkOpportunities(raw);

    expect(draft.responsibilities).toBe("Ship features\nFix bugs\nReview PRs");
    expect(draft.requirements).toBe("2+ years experience");
  });

  it("returns an empty array for blank input", () => {
    expect(parseBulkOpportunities("")).toEqual([]);
    expect(parseBulkOpportunities("   \n\n  ")).toEqual([]);
  });
});
