import { getAllSubscriptionsForAdmin } from "@/lib/data/subscriptions";

// The direct answer to "did this payment actually get him full access?" --
// every row in the `subscriptions` table, newest first, with the paying
// user's email attached. No filtering/pagination UI (the table is small
// enough right now to just scroll); revisit if it ever gets long.
export default async function AdminSubscriptionsPage() {
  const subscriptions = await getAllSubscriptionsForAdmin();

  return (
    <div className="admin-shell">
      <main className="admin-page admin-page-wide">
        <div className="admin-page-header">
          <h1>Subscriptions</h1>
        </div>
        <p className="hint" style={{ marginTop: -8, marginBottom: 24 }}>
          Every payment attempt, newest first. <strong>Active</strong> means that person can see every
          HR email/contact, Google Form, and application link site-wide right now. Rows stuck on{" "}
          <strong>Created</strong> are abandoned checkouts -- the person never actually paid.
        </p>

        {subscriptions.length === 0 ? (
          <div className="empty-state">
            <h3>No payments yet</h3>
            <p>This fills in as soon as someone unlocks full access.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Product</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Access until</th>
                  <th>Payment ID</th>
                  <th>Paid on</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub.id}>
                    <td>{sub.email ?? "—"}</td>
                    <td>{sub.product}</td>
                    <td>₹{(sub.amount_paise / 100).toFixed(0)}</td>
                    <td>
                      <span className={`status-badge status-${sub.status}`}>{sub.status}</span>
                    </td>
                    <td>
                      {sub.current_period_end
                        ? new Date(sub.current_period_end).toLocaleDateString("en-IN")
                        : "—"}
                    </td>
                    <td>{sub.razorpay_payment_id ?? "—"}</td>
                    <td>{new Date(sub.created_at).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
