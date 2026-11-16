// Masks contact/apply info (emails, links, phone numbers) inside free text so
// a job's description can be shown publicly — to visitors and to Google —
// without giving away the paid apply details. Used for the public "Job
// details" section (app/opportunities/[id]/page.tsx) and the JobPosting
// schema description (lib/seo/job-posting.ts), so both always match.
const LOCK = "[unlock to view]";

export function maskContact(text: string | null | undefined): string {
  if (!text) return "";
  return (
    text
      // emails
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, LOCK)
      // links (http, www, wa.me, bit.ly, forms.gle …)
      .replace(/\b(?:https?:\/\/|www\.)\S+/gi, LOCK)
      .replace(/\b(?:wa\.me|forms\.gle|bit\.ly|t\.me|lnkd\.in|tinyurl\.com)\/\S*/gi, LOCK)
      // phone numbers: +91 / 0 prefixes, 10 digits with optional spaces/dashes
      .replace(/(?:\+?91[\s-]?)?(?<!\d)[6-9]\d(?:[\s-]?\d){8}(?!\d)/g, LOCK)
      // collapse repeats like "[unlock to view] [unlock to view]"
      .replace(/(\[unlock to view\][\s,/|]*){2,}/g, `${LOCK} `)
  );
}
