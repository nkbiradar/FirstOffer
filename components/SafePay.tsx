// "Safe to pay" row under the Full Access buy button: the payment methods
// Razorpay accepts + the secure-payment note. Text chips (not brand logos).
const METHODS = ["UPI", "Google Pay", "PhonePe", "Paytm"];

export default function SafePay({ light = false }: { light?: boolean }) {
  return (
    <div className={`safe-pay${light ? " safe-pay-light" : ""}`}>
      <div className="safe-pay-methods">
        {METHODS.map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
      <p>
        <span aria-hidden="true">🔒</span> Secure payment by <strong>Razorpay</strong> · No auto-debit
      </p>
    </div>
  );
}
