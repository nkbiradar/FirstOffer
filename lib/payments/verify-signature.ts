import crypto from "crypto";

/**
 * Razorpay's documented post-checkout signature check: HMAC-SHA256 of
 * "order_id|payment_id" using the account's key secret, compared against
 * the signature Checkout hands back to the browser.
 *
 * Pulled out of app/api/payments/verify/route.ts as a pure function so it
 * can be unit-tested directly — this is the single highest-risk piece of
 * logic in the app (it's what decides whether a payment is real), so it's
 * the first thing worth locking down with tests, ahead of anything else
 * that only touches routing/DB plumbing around it.
 */
export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
  keySecret,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
  keySecret: string;
}): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  // Constant-time comparison — a plain `===` on a secret-derived value
  // leaks timing information about how many leading bytes matched, which
  // in principle helps an attacker forge a valid signature byte-by-byte.
  // Buffers must be equal length for timingSafeEqual, so a length
  // mismatch (a not-even-close forged signature) is rejected first.
  const expected = Buffer.from(expectedSignature, "hex");
  const actual = Buffer.from(signature, "hex");
  if (expected.length !== actual.length) return false;

  return crypto.timingSafeEqual(expected, actual);
}
