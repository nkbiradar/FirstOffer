"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { parseBulkOpportunities, type BulkDraftOpportunity } from "@/lib/bulk-import-parse";

type EditableItem = BulkDraftOpportunity & {
  id: string;
  status: string;
  error?: string;
};

const EXAMPLE_FORMAT = `---OPPORTUNITY---
Company: Hartford
Role: Associate Software Engineer
Type: Full-time
Batch: 2026
CTC: ₹15–20 LPA
Location: Bangalore
Skills: DSA, Python
Application URL: https://...
HR Email: hr@hartford.com
Google Form:
Additional Details:
---END---

---OPPORTUNITY---
Company: Vedantu
Role: Product Intern
Type: Internship
Batch: 2025, 2026, 2027
Stipend: ₹30,000/month
Location: Bengaluru
Skills: SQL, Excel, AI
Google Form: https://forms.gle/example
---END---`;

let nextId = 1;
function newItemId() {
  nextId += 1;
  return `bulk-${nextId}`;
}

/** Normalized "company|role" key, purely for the display-only duplicate flag below. */
function duplicateKey(item: Pick<EditableItem, "company" | "role">) {
  return `${item.company.trim().toLowerCase()}|${item.role.trim().toLowerCase()}`;
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="bulk-field">
      {label}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="bulk-field bulk-field-wide">
      {label}
      <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="bulk-field">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

type DbMatch = { existingId: string; existingStatus: string };

export default function BulkImportClient() {
  const router = useRouter();
  const [rawText, setRawText] = useState("");
  const [items, setItems] = useState<EditableItem[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isExtractingWithAi, setIsExtractingWithAi] = useState(false);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [dbMatches, setDbMatches] = useState<Map<string, DbMatch>>(new Map());

  // Display-only: which item ids share a normalized company+role with
  // another item currently in the list. Never blocks or changes publishing.
  const duplicateIds = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      const key = duplicateKey(item);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const ids = new Set<string>();
    for (const item of items) {
      if ((counts.get(duplicateKey(item)) ?? 0) > 1) ids.add(item.id);
    }
    return ids;
  }, [items]);

  const errorCount = items.filter((item) => item.error).length;
  const readyCount = items.length - errorCount;

  function handleParse() {
    const drafts = parseBulkOpportunities(rawText);
    setItems(
      drafts.map((draft) => ({
        ...draft,
        id: newItemId(),
        status: "published",
      })),
    );
    setDbMatches(new Map());
    setSummary(null);
    setTopError(null);
  }

  // Upgrade to handleParse() above — same result shape, but understands
  // postings that don't follow the ---OPPORTUNITY---/"Label:" format the
  // regex parser expects. Requires ANTHROPIC_API_KEY to be configured
  // server-side; if it isn't, the API returns a clear error instead of
  // silently doing nothing.
  async function handleParseWithAi() {
    if (!rawText.trim()) return;
    setIsExtractingWithAi(true);
    setTopError(null);
    setSummary(null);
    try {
      const response = await fetch("/api/admin/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText }),
      });
      const body = await response.json();

      if (!response.ok) {
        setTopError(body?.error ?? "AI extraction failed.");
        return;
      }

      const drafts: BulkDraftOpportunity[] = Array.isArray(body.items) ? body.items : [];
      if (drafts.length === 0) {
        setTopError("The AI didn't find any opportunities in that text.");
        return;
      }

      setItems(
        drafts.map((draft) => ({
          ...draft,
          id: newItemId(),
          status: "published",
        })),
      );
      setDbMatches(new Map());
    } catch {
      setTopError("Network error — could not reach the server. Nothing was parsed.");
    } finally {
      setIsExtractingWithAi(false);
    }
  }

  // Checks the currently parsed items against every opportunity already in
  // the database (not just each other) — display-only, like the in-batch
  // duplicate flag below, and never blocks publishing.
  async function handleCheckDuplicates() {
    if (items.length === 0) return;
    setIsCheckingDuplicates(true);
    try {
      const response = await fetch("/api/admin/opportunities/check-duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: items.map((item) => ({ company: item.company, role: item.role })) }),
      });
      const body = await response.json();

      if (response.ok && Array.isArray(body.matches)) {
        const next = new Map<string, DbMatch>();
        for (const match of body.matches as { index: number; existingId: string; existingStatus: string }[]) {
          const item = items[match.index];
          if (item) next.set(item.id, { existingId: match.existingId, existingStatus: match.existingStatus });
        }
        setDbMatches(next);
      }
    } catch {
      // Best-effort helper check — publishing still works even if this fails.
    } finally {
      setIsCheckingDuplicates(false);
    }
  }

  function updateField(id: string, field: keyof BulkDraftOpportunity, value: string) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  }

  function updateStatus(id: string, status: string) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  async function handlePublishAll() {
    if (items.length === 0) return;
    setIsPublishing(true);
    setTopError(null);
    setSummary(null);

    const submitted = items;

    try {
      const response = await fetch("/api/admin/opportunities/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: submitted.map(({ id, error, ...rest }) => rest),
        }),
      });

      const body = await response.json();

      if (!response.ok) {
        setTopError(body?.error ?? "Failed to publish.");
        return;
      }

      const results: { index: number; success: boolean; error?: string }[] = body.results ?? [];
      const failed = new Map(results.filter((r) => !r.success).map((r) => [r.index, r.error ?? "Failed."]));
      const succeededCount = results.length - failed.size;

      // Keep only the items that failed (with their error attached) so a
      // second "Publish All" click doesn't re-submit ones that already
      // saved successfully — only what still needs fixing stays on screen.
      setItems(
        submitted
          .map((item, index) => ({ item, index }))
          .filter(({ index }) => failed.has(index))
          .map(({ item, index }) => ({ ...item, error: failed.get(index) })),
      );

      setSummary(
        `${succeededCount} of ${submitted.length} published successfully.` +
          (failed.size > 0 ? ` ${failed.size} failed — see the errors below, fix, and Publish All again.` : ""),
      );

      if (succeededCount > 0) {
        router.refresh();
      }
    } catch {
      setTopError("Network error — could not reach the server. Nothing was published.");
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <div className="bulk-import">
      <section className="card bulk-import-paste">
        <label className="bulk-field bulk-field-wide">
          Paste opportunities
          <textarea
            rows={14}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={EXAMPLE_FORMAT}
          />
        </label>
        <p className="hint">
          Use <code>---OPPORTUNITY---</code> before each opportunity and <code>---END---</code> after it (shown as
          the placeholder text above). Each opportunity&apos;s full pasted text is always kept as its original
          source — nothing is discarded even if a field isn&apos;t recognized.
        </p>
        <div className="form-actions">
          <button className="btn btn-primary" type="button" onClick={handleParse} disabled={!rawText.trim()}>
            Parse Opportunities
          </button>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={handleParseWithAi}
            disabled={!rawText.trim() || isExtractingWithAi}
          >
            {isExtractingWithAi ? "Extracting with AI..." : "Parse with AI"}
          </button>
        </div>
      </section>

      {topError && <p className="form-error">{topError}</p>}
      {summary && <p className="bulk-summary">{summary}</p>}

      {items.length > 0 && (
        <section className="bulk-import-preview">
          <div className="bulk-summary-bar">
            <span className="bulk-summary-stat detected">
              <span className="dot" />
              {items.length} Detected
            </span>
            <span className="bulk-summary-stat ready">
              <span className="dot" />
              {readyCount} Ready
            </span>
            {errorCount > 0 && (
              <span className="bulk-summary-stat errors">
                <span className="dot" />
                {errorCount} Error{errorCount === 1 ? "" : "s"}
              </span>
            )}
            {duplicateIds.size > 0 && (
              <span className="bulk-summary-stat duplicates">
                <span className="dot" />
                {duplicateIds.size} Possible Duplicate{duplicateIds.size === 1 ? "" : "s"}
              </span>
            )}
            {dbMatches.size > 0 && (
              <span className="bulk-summary-stat duplicates">
                <span className="dot" />
                {dbMatches.size} Already in Database
              </span>
            )}
          </div>

          <div className="bulk-item-header" style={{ padding: 0, marginBottom: 8 }}>
            <h2 style={{ margin: 0 }}>Review, edit, or remove before publishing</h2>
            <button
              className="btn btn-secondary btn-sm"
              type="button"
              onClick={handleCheckDuplicates}
              disabled={isCheckingDuplicates}
            >
              {isCheckingDuplicates ? "Checking..." : "Check Against Database"}
            </button>
          </div>

          <div className="bulk-items">
            {items.map((item, index) => {
              const isDuplicate = duplicateIds.has(item.id);
              const dbMatch = dbMatches.get(item.id);
              return (
                <div
                  className={`card bulk-item-card ${isDuplicate ? "is-duplicate" : ""} ${item.error ? "has-error" : ""}`}
                  key={item.id}
                >
                  <div className="bulk-item-header">
                    <span className="bulk-item-number">#{index + 1}</span>
                    <SelectField
                      label="Status"
                      value={item.status}
                      onChange={(value) => updateStatus(item.id, value)}
                      options={[
                        { value: "published", label: "Published" },
                        { value: "draft", label: "Draft" },
                      ]}
                    />
                    <div className="bulk-item-flags">
                      {isDuplicate && <span className="badge" style={{ background: "var(--color-warning-soft)", color: "var(--color-warning)", borderColor: "var(--color-warning-border)" }}>Possible duplicate</span>}
                      {dbMatch && (
                        <span className="badge" style={{ background: "var(--color-warning-soft)", color: "var(--color-warning)", borderColor: "var(--color-warning-border)" }}>
                          Already in database ({dbMatch.existingStatus})
                        </span>
                      )}
                    </div>
                    <button className="btn-danger" type="button" onClick={() => removeItem(item.id)}>
                      Remove
                    </button>
                  </div>

                  {item.error && <p className="form-error">{item.error}</p>}

                  <div className="bulk-item-grid">
                    <TextField label="Company" value={item.company} onChange={(v) => updateField(item.id, "company", v)} />
                    <TextField label="Role" value={item.role} onChange={(v) => updateField(item.id, "role", v)} />
                    <SelectField
                      label="Type"
                      value={item.opportunityType}
                      onChange={(v) => updateField(item.id, "opportunityType", v)}
                      options={[
                        { value: "", label: "— Not specified —" },
                        { value: "internship", label: "Internship" },
                        { value: "full_time", label: "Full-time" },
                      ]}
                    />
                    <TextField
                      label="Batch"
                      value={item.batch}
                      onChange={(v) => updateField(item.id, "batch", v)}
                      placeholder="2025, 2026"
                    />
                    <TextField label="Degree" value={item.degree} onChange={(v) => updateField(item.id, "degree", v)} />
                    <TextField label="Branch" value={item.branches} onChange={(v) => updateField(item.id, "branches", v)} />
                    <TextField label="Stipend" value={item.stipend} onChange={(v) => updateField(item.id, "stipend", v)} />
                    <TextField label="Salary / CTC" value={item.salary} onChange={(v) => updateField(item.id, "salary", v)} />
                    <TextField label="Location" value={item.location} onChange={(v) => updateField(item.id, "location", v)} />
                    <SelectField
                      label="Work Mode"
                      value={item.workMode}
                      onChange={(v) => updateField(item.id, "workMode", v)}
                      options={[
                        { value: "", label: "— Not specified —" },
                        { value: "onsite", label: "On-site" },
                        { value: "hybrid", label: "Hybrid" },
                        { value: "remote", label: "Remote" },
                      ]}
                    />
                    <TextField label="Skills" value={item.skills} onChange={(v) => updateField(item.id, "skills", v)} />
                    <TextField
                      label="Application URL"
                      type="url"
                      value={item.applicationUrl}
                      onChange={(v) => updateField(item.id, "applicationUrl", v)}
                    />
                    <TextField
                      label="Google Form"
                      type="url"
                      value={item.googleFormUrl}
                      onChange={(v) => updateField(item.id, "googleFormUrl", v)}
                    />
                    <TextField label="HR Email" type="email" value={item.hrEmail} onChange={(v) => updateField(item.id, "hrEmail", v)} />
                    <TextField label="HR Contact" value={item.hrContact} onChange={(v) => updateField(item.id, "hrContact", v)} />
                    <TextField
                      label="Deadline"
                      type="date"
                      value={item.deadline}
                      onChange={(v) => updateField(item.id, "deadline", v)}
                    />
                  </div>

                  <TextAreaField
                    label="Responsibilities (one per line)"
                    value={item.responsibilities}
                    onChange={(v) => updateField(item.id, "responsibilities", v)}
                  />
                  <TextAreaField
                    label="Requirements (one per line)"
                    value={item.requirements}
                    onChange={(v) => updateField(item.id, "requirements", v)}
                  />
                  <TextAreaField label="Eligibility" value={item.eligibility} onChange={(v) => updateField(item.id, "eligibility", v)} />
                  <TextAreaField
                    label="Additional Details"
                    value={item.additionalDetails}
                    onChange={(v) => updateField(item.id, "additionalDetails", v)}
                  />
                  <TextAreaField label="How to Apply" value={item.howToApply} onChange={(v) => updateField(item.id, "howToApply", v)} />

                  <details className="bulk-item-source">
                    <summary>Original pasted text (captured automatically, not editable here)</summary>
                    <pre>{item.sourceText}</pre>
                  </details>
                </div>
              );
            })}
          </div>

          <div className="form-actions">
            <button className="btn btn-primary" type="button" onClick={handlePublishAll} disabled={isPublishing}>
              {isPublishing ? "Publishing..." : `Publish All (${items.length})`}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
