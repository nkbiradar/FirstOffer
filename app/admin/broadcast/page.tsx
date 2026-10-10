export const metadata = { title: "Email all users — Admin" };

type SearchParams = { [key: string]: string | string[] | undefined };
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function AdminBroadcastPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const error = first(params.error);
  const sent = first(params.sent);
  const mode = first(params.mode);

  return (
    <div className="admin-shell">
      <main className="admin-page">
        <div className="admin-page-header">
          <h1>Email all users</h1>
        </div>
        <p className="hint">
          Sends one personal email to every user who has signed in on FirstOffer, from your FirstOffer address.
          People who unsubscribed are skipped automatically, and every email has an unsubscribe link. Replies go to
          your support inbox. <strong>Always send a test to yourself first.</strong>
        </p>

        {error && <p className="admin-login-error">{error}</p>}
        {sent && (
          <p className="broadcast-success">
            {mode === "all"
              ? `✅ Sent to ${sent} users.`
              : sent === "0"
                ? "Test not sent — your admin email isn't a signed-in FirstOffer user (or it's unsubscribed)."
                : "✅ Test email sent to you — check your inbox (and spam)."}
          </p>
        )}

        <form action="/api/admin/broadcast" className="card broadcast-form" method="post">
          <label>
            Subject
            <input maxLength={150} name="subject" placeholder="1 minute to help us make FirstOffer better for you?" required />
          </label>
          <label>
            Heading (inside the email)
            <input maxLength={150} name="heading" placeholder="We'd love your feedback" />
          </label>
          <label>
            Message
            <textarea
              maxLength={5000}
              name="message"
              placeholder={"Hi there,\n\nI'm Nayan, founder of FirstOffer…"}
              required
              rows={12}
            />
            <span className="hint">Plain text. Line breaks are kept and links become clickable.</span>
          </label>
          <div className="broadcast-row">
            <label>
              Button text
              <input maxLength={60} name="ctaLabel" placeholder="Give feedback (1 min)" />
            </label>
            <label>
              Button link
              <input name="ctaUrl" placeholder="https://forms.gle/… or /opportunities" />
            </label>
          </div>

          <label className="broadcast-confirm">
            <input name="confirm" style={{ width: "auto" }} type="checkbox" />
            I&apos;ve sent a test and want to email <strong>all users</strong>.
          </label>

          <div className="broadcast-actions">
            <button className="btn btn-secondary" name="mode" type="submit" value="test">
              Send test to me
            </button>
            <button className="btn btn-primary" name="mode" type="submit" value="all">
              Send to all users
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
