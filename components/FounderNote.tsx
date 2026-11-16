import { FOUNDER } from "@/lib/founder";

// Small, professional "who's behind this" line: initials avatar, name,
// credential, and a LinkedIn link (hidden if lib/founder.ts has none).
export default function FounderNote({ dark = false }: { dark?: boolean }) {
  return (
    <div className={`founder-note${dark ? " founder-note-dark" : ""}`}>
      <span aria-hidden="true" className="founder-note-avatar">
        {FOUNDER.initials}
      </span>
      <div className="founder-note-text">
        <span className="founder-note-name">
          Built by <strong>{FOUNDER.name}</strong>
        </span>
        <span className="founder-note-cred">
          {FOUNDER.title} · {FOUNDER.credential}
        </span>
      </div>
      {FOUNDER.linkedin && (
        <a
          aria-label={`${FOUNDER.name} on LinkedIn`}
          className="founder-note-link"
          href={FOUNDER.linkedin}
          rel="noopener noreferrer"
          target="_blank"
        >
          <span aria-hidden="true" className="founder-note-in">
            in
          </span>
          LinkedIn
        </a>
      )}
    </div>
  );
}
