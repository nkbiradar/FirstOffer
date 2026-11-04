import { getQueueStatus } from "@/lib/email/broadcast";

export const metadata = { title: "Email users — Admin" };
export const dynamic = "force-dynamic";

type SearchParams = { [key: string]: string | string[] | undefined };
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const AUDIENCE_LABEL: Record<string, string> = {
  all: "all signed-up users",
  paid: "paid members",
  unpaid: "signed-up users who haven't paid",
};

export default async function AdminBroadcastPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const error = first(params.error);
  const test = first(params.test);
  const queued = first(params.queued);
  const audience = first(params.audience) ?? "all";
  const status = await getQueueStatus();

  return (
    <div className="admin-shell">
      <main className="admin-page">
        <div className="admin-page-header">
          <h1>Email users</h1>
        </div>
        <p className="hint">
          Sent from <strong>Team FirstOffer &lt;support@firstoffer.online&gt;</strong> through your Hostinger mailbox, in
          batches of 30 every 10 minutes (max {status.limit} a day) so it stays out of spam. Unsubscribed users are
          skipped and every email has an unsubscribe link. Write <code>{"{Name}"}</code> anywhere for the
          student&apos;s first name. <strong>Always send a test to yourself first.</strong>
        </p>

        <p className="hint">
          Queue: <strong>{status.pending}</strong> waiting · <strong>{status.sentToday}</strong> sent in the last 24h
          {status.failedToday ? (
            <>
              {" "}
              · <strong>{status.failedToday}</strong> failed
            </>
          ) : null}
        </p>

        {error && <p className="admin-login-error">{error}</p>}
        {test && <p className="broadcast-success">✅ Test email sent to you — check your inbox (and spam).</p>}
        {queued && !error && (
          <p className="broadcast-success">
            ✅ {queued} emails queued for {AUDIENCE_LABEL[audience] ?? "users"}. They&apos;ll go out over the next few
            hours (up to {status.limit} a day).
          </p>
        )}

        <form action="/api/admin/broadcast" className="card broadcast-form" method="post">
          <label>
            Send to
            <select defaultValue="all" name="audience">
              <option value="all">Everyone who signed up</option>
              <option value="paid">Paid members only</option>
              <option value="unpaid">Signed up but not paid</option>
            </select>
          </label>
          <label>
            Subject
            <input maxLength={150} name="subject" placeholder="What 116 interview calls taught us, {Name}" required />
          </label>
          <label>
            Heading (inside the email)
            <input maxLength={150} name="heading" placeholder="Real results from FirstOffer students" />
          </label>
          <label>
            Message
            <textarea
              maxLength={6000}
              name="message"
              placeholder={"Hi {Name},\n\nThank you for signing up on FirstOffer…"}
              required
              rows={14}
            />
            <span className="hint">Plain text. Line breaks are kept and links become clickable.</span>
          </label>
          <div className="broadcast-row">
            <label>
              Button text (optional)
              <input maxLength={60} name="ctaLabel" placeholder="See what's included" />
            </label>
            <label>
              Button link
              <input name="ctaUrl" placeholder="/unlock or https://forms.gle/…" />
            </label>
          </div>

          <label className="broadcast-confirm">
            <input name="confirm" style={{ width: "auto" }} type="checkbox" />
            I&apos;ve sent a test and want to send this to the group selected above.
          </label>

          <div className="broadcast-actions">
            <button className="btn btn-secondary" name="mode" type="submit" value="test">
              Send test to me
            </button>
            <button className="btn btn-primary" name="mode" type="submit" value="send">
              Send to selected group
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
