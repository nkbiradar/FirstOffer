import type { ReferralOpening } from "@/lib/data/referral-openings";

// Locked preview of a referral opening for visitors WITHOUT Internal HR:
// company, role, batch, CTC, location, job ID, deadline and the description
// are shown so people can see what they'd get. The apply link, referrer's
// email, JD link and applicant note are never passed to this component, so
// they never reach a locked visitor's browser. Any email address or link
// typed into the description is masked too.
export type ReferralOpeningPublic = Pick<
  ReferralOpening,
  "id" | "company" | "role" | "batch" | "ctc" | "location" | "job_id" | "apply_by" | "details"
>;

export function toPublicOpening(o: ReferralOpening): ReferralOpeningPublic {
  const mask = (t: string | null) =>
    t
      ? t
          .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "🔒 hidden — unlock to see")
          .replace(/https?:\/\/\S+/gi, "🔒 link hidden")
      : null;
  return {
    id: o.id,
    company: o.company,
    role: o.role,
    batch: o.batch,
    ctc: o.ctc,
    location: o.location,
    job_id: o.job_id,
    apply_by: o.apply_by,
    details: mask(o.details),
  };
}

export default function ReferralOpeningPreview({ opening }: { opening: ReferralOpeningPublic }) {
  const rows: [string, string | null][] = [
    ["Company", opening.company],
    ["Role", opening.role],
    ["Batch", opening.batch],
    ["CTC", opening.ctc],
    ["Location", opening.location],
    ["Job ID", opening.job_id],
  ];
  const applyBy = opening.apply_by
    ? new Date(`${opening.apply_by}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    : null;
  return (
    <div className="referral-opening referral-opening-locked">
      <div className="referral-opening-head">
        <strong className="referral-opening-alert">🚨 Referral Alert 🚨</strong>
        {applyBy && <span className="referral-opening-deadline">Apply by {applyBy}</span>}
      </div>
      <dl className="referral-opening-facts">
        {rows
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} style={{ display: "contents" }}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
      </dl>
      {opening.details && <p className="referral-opening-details">{opening.details}</p>}
      <div className="referral-opening-lockbar">
        <span>🔒 Referrer contact, apply link &amp; instructions are for Internal HR members</span>
        <a className="btn btn-primary btn-sm" href="#unlock-internal-hr">
          Unlock to apply
        </a>
      </div>
    </div>
  );
}
