"use client";

import { useEffect, useRef, useState } from "react";

type OpportunityOption = {
  id: string;
  role: string;
  company: string | null;
  location?: string | null;
  opportunityType?: string | null;
};

type RelatedKeyword = { jdKeyword: string; foundAs: string };

type MatchResult = {
  role: string;
  company: string | null;
  matching: string[];
  missing: string[];
  related: RelatedKeyword[];
  matchPercent: number;
  totalJdKeywords: number;
};

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt"];

function isAcceptedFile(file: File): boolean {
  const lower = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

// The interactive half of /resume-match (app/resume-match/page.tsx renders
// the surrounding hero/FAQ). Nothing here persists the resume anywhere —
// it's sent straight to app/api/resume-match/route.ts and the response is
// this component's only memory of it.
export default function ResumeMatchTool({
  initialOpportunity,
}: {
  initialOpportunity: OpportunityOption | null;
}) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<OpportunityOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selected, setSelected] = useState<OpportunityOption | null>(initialOpportunity);

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);

  // Debounced job search — fires 300ms after the user stops typing, mirrors
  // the pattern already used for /opportunities' search box but as a live
  // typeahead instead of a full page navigation.
  useEffect(() => {
    if (selected || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const handle = setTimeout(async () => {
      try {
        const response = await fetch(`/api/opportunities/search?q=${encodeURIComponent(query.trim())}`);
        const data = await response.json();
        setSearchResults(Array.isArray(data.opportunities) ? data.opportunities : []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query, selected]);

  function pickOpportunity(option: OpportunityOption) {
    setSelected(option);
    setQuery("");
    setSearchResults([]);
    setShowResults(false);
    setResult(null);
    setError(null);
  }

  function clearOpportunity() {
    setSelected(null);
    setResult(null);
  }

  function handleFile(nextFile: File | null) {
    setResult(null);
    setError(null);
    if (!nextFile) {
      setFile(null);
      return;
    }
    if (!isAcceptedFile(nextFile)) {
      setError("Please upload a PDF, DOCX, or TXT file.");
      return;
    }
    if (nextFile.size > 5 * 1024 * 1024) {
      setError("That file is larger than 5MB — please upload a smaller resume file.");
      return;
    }
    setFile(nextFile);
  }

  async function handleSubmit() {
    if (!selected || !file) return;
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("opportunityId", selected.id);
      formData.append("resume", file);

      const response = await fetch("/api/resume-match", { method: "POST", body: formData });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Something went wrong — please try again.");
        return;
      }
      setResult(data as MatchResult);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit = Boolean(selected && file && !isSubmitting);

  return (
    <div className="resume-match-tool">
      <div className="resume-match-disclaimer">
        <span className="resume-match-disclaimer-icon" aria-hidden="true">🔒</span>
        <p>
          <strong>We never rewrite your resume or invent skills.</strong> This only compares words already
          in your resume against a job&apos;s own listed keywords. Add a suggested keyword to your resume
          only if you genuinely have that skill or experience. Your resume is processed instantly and never
          stored.
        </p>
      </div>

      <div className="resume-match-grid">
        <div className="card resume-match-step">
          <span className="resume-match-step-number">1</span>
          <h2>Pick a job</h2>
          {selected ? (
            <div className="resume-match-selected-job">
              <div>
                <p className="resume-match-selected-role">{selected.role}</p>
                {selected.company && <p className="resume-match-selected-company">{selected.company}</p>}
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={clearOpportunity}>
                Change
              </button>
            </div>
          ) : (
            <div className="job-picker">
              <input
                type="text"
                className="job-picker-input"
                placeholder="Search by role or company (e.g. Frontend Developer)"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                aria-label="Search for a job to compare your resume against"
              />
              {showResults && query.trim().length >= 2 && (
                <div className="job-picker-results">
                  {isSearching && <p className="job-picker-empty">Searching…</p>}
                  {!isSearching && searchResults.length === 0 && (
                    <p className="job-picker-empty">No live opportunities match that search.</p>
                  )}
                  {!isSearching &&
                    searchResults.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className="job-picker-result"
                        onClick={() => pickOpportunity(option)}
                      >
                        <span className="job-picker-result-role">{option.role}</span>
                        {option.company && <span className="job-picker-result-company">{option.company}</span>}
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card resume-match-step">
          <span className="resume-match-step-number">2</span>
          <h2>Upload your resume</h2>
          <div
            className={`resume-dropzone ${isDragging ? "resume-dropzone-active" : ""}`}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              handleFile(event.dataTransfer.files?.[0] ?? null);
            }}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") fileInputRef.current?.click();
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              className="resume-dropzone-input"
              onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
              aria-label="Upload your resume"
            />
            {file ? (
              <p className="resume-dropzone-file">
                📄 {file.name}
                <span>Click or drop to replace</span>
              </p>
            ) : (
              <p className="resume-dropzone-hint">
                <strong>Click to upload</strong> or drag and drop
                <span>PDF, DOCX, or TXT — max 5MB</span>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="resume-match-actions">
        <button type="button" className="btn btn-primary" disabled={!canSubmit} onClick={handleSubmit}>
          {isSubmitting ? "Comparing…" : "Compare keywords"}
        </button>
      </div>

      {error && <p className="unlock-contact-error resume-match-error">{error}</p>}

      {result && (
        <div className="resume-match-results">
          <div className="resume-match-score-card">
            <div
              className="resume-match-score-ring"
              style={{ ["--match-percent" as string]: `${result.matchPercent}%` }}
            >
              <span className="resume-match-score-value">{result.matchPercent}%</span>
            </div>
            <div>
              <p className="resume-match-score-title">Keyword match for {result.role}</p>
              {result.company && <p className="resume-match-score-company">{result.company}</p>}
              <p className="resume-match-score-note">
                Based on {result.totalJdKeywords} keyword{result.totalJdKeywords === 1 ? "" : "s"} this job
                lists — related keywords below aren&apos;t counted in the percentage.
              </p>
            </div>
          </div>

          <div className="keyword-section">
            <h3 className="keyword-section-title keyword-section-title-match">
              ✅ Matching keywords ({result.matching.length})
            </h3>
            {result.matching.length === 0 ? (
              <p className="keyword-section-empty">None of this job&apos;s keywords showed up in your resume yet.</p>
            ) : (
              <div className="keyword-chip-grid">
                {result.matching.map((keyword) => (
                  <span key={keyword} className="keyword-chip keyword-chip-match">
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </div>

          {result.related.length > 0 && (
            <div className="keyword-section">
              <h3 className="keyword-section-title keyword-section-title-related">
                🔄 Related/alternative keywords ({result.related.length})
              </h3>
              <p className="keyword-section-hint">
                You don&apos;t have the exact keyword, but your resume mentions something comparable — worth
                a mention only if it genuinely reflects your experience.
              </p>
              <div className="keyword-chip-grid">
                {result.related.map((item) => (
                  <span key={item.jdKeyword} className="keyword-chip keyword-chip-related">
                    Job wants <strong>{item.jdKeyword}</strong> — you have <strong>{item.foundAs}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="keyword-section">
            <h3 className="keyword-section-title keyword-section-title-missing">
              ⚠️ Missing keywords ({result.missing.length})
            </h3>
            {result.missing.length === 0 ? (
              <p className="keyword-section-empty">Nothing missing — your resume covers every listed keyword.</p>
            ) : (
              <>
                <p className="keyword-section-hint">
                  Add any of these to your resume <strong>only if you genuinely have that skill or experience</strong>.
                </p>
                <div className="keyword-chip-grid">
                  {result.missing.map((keyword) => (
                    <span key={keyword} className="keyword-chip keyword-chip-missing">
                      {keyword}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
