// Server-only Razorpay wrapper for the "unlock HR contact info" payment
// flow (Phase 6). Never import this from a Client Component — it needs
// RAZORPAY_KEY_SECRET, which must never reach the browser.
import Razorpay from "razorpay";

let cachedClient: Razorpay | null = null;

export function getRazorpayClient(): Razorpay {
  if (cachedClient) return cachedClient;

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET.");
  }

  cachedClient = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return cachedClient;
}

// One-time price to reveal HR Email/HR Contact on a single opportunity.
// UPI-only at checkout (see components/UnlockContactCard.tsx's `method`
// config) — no cards, netbanking, wallets, or EMI offered.
export const CONTACT_UNLOCK_PRICE_INR = 49;
export const CONTACT_UNLOCK_PRICE_PAISE = CONTACT_UNLOCK_PRICE_INR * 100;
