import { storyByline, tagLabel, type WhatWorkedStory } from "@/lib/data/what-worked";

// One "What Worked For Me" story: before → what changed → result.
export default function WhatWorkedCard({ story, compact = false }: { story: WhatWorkedStory; compact?: boolean }) {
  const changes = story.what_changed
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-•*\d.)]+\s*/, "").trim())
    .filter(Boolean);
  const shown = compact ? changes.slice(0, 3) : changes;
  const initials = story.is_anonymous
    ? "?"
    : story.display_name
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

  return (
    <article className="ww-card">
      <header className="ww-card-head">
        <span aria-hidden="true" className="ww-avatar">
          {initials}
        </span>
        <div className="ww-who">
          <p className="ww-name">{storyByline(story)}</p>
          {story.target_role && <p className="ww-role">Targeting {story.target_role}</p>}
        </div>
      </header>

      <div className="ww-before">
        <span className="ww-label ww-label-before">Before</span>
        <p>
          {story.applications_before ? <strong>{story.applications_before} applications, few or no calls. </strong> : null}
          {!compact && story.what_wasnt_working}
        </p>
      </div>

      <div className="ww-changed">
        <span className="ww-label ww-label-changed">What I changed</span>
        <ul>
          {shown.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </div>

      <div className="ww-result">
        <span className="ww-label ww-label-result">Result</span>
        <p>{story.result}</p>
      </div>

      {!compact && story.tags.length > 0 && (
        <div className="ww-tags">
          {story.tags.map((t) => (
            <span className="ww-tag" key={t}>
              {tagLabel(t)}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
