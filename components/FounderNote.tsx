import { FOUNDER } from "@/lib/founder";

// Small, professional "who's behind this" line: initials avatar, name,
// credential, and a LinkedIn link (hidden if lib/founder.ts has none).
export default function FounderNote({ dark = false }: { dark?: boolean }) {
  return (
    <div className={`founder-note${dark ? " founder-note-dark" : ""}`}>
      <img alt="" aria-hidden="true" className="founder-note-avatar" height={40} src="/icon.png" width={40} />
      <div className="founder-note-text">
        <span className="founder-note-name">
          <strong>{FOUNDER.title}</strong>
        </span>
        <span className="founder-note-cred">{FOUNDER.credential}</span>
      </div>
      {FOUNDER.linkedin && (
        <a
          aria-label="Founder on LinkedIn"
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
