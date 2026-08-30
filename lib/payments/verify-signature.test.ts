import { describe, expect, it } from "vitest";
import crypto from "crypto";
import { verifyRazorpaySignature } from "./verify-signature";

const KEY_SECRET = "test_key_secret_do_not_use_in_prod";

function signFor(orderId: string, paymentId: string, keySecret = KEY_SECRET): string {
  return crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
}

describe("verifyRazorpaySignature", () => {
  it("accepts a correctly signed order/payment pair", () => {
    const orderId = "order_ABC123";
    const paymentId = "pay_XYZ789";
    const signature = signFor(orderId, paymentId);

    expect(
      verifyRazorpaySignature({ orderId, paymentId, signature, keySecret: KEY_SECRET }),
    ).toBe(true);
  });

  it("rejects a tampered payment id (signature no longer matches)", () => {
    const orderId = "order_ABC123";
    const signature = signFor(orderId, "pay_XYZ789");

    expect(
      verifyRazorpaySignature({
        orderId,
        paymentId: "pay_ATTACKER1",
        signature,
        keySecret: KEY_SECRET,
      }),
    ).toBe(false);
  });

  it("rejects a signature produced with the wrong key secret", () => {
    const orderId = "order_ABC123";
    const paymentId = "pay_XYZ789";
    const signature = signFor(orderId, paymentId, "some_other_secret");

    expect(
      verifyRazorpaySignature({ orderId, paymentId, signature, keySecret: KEY_SECRET }),
    ).toBe(false);
  });

  it("rejects a garbage/empty signature instead of throwing", () => {
    expect(
      verifyRazorpaySignature({
        orderId: "order_ABC123",
        paymentId: "pay_XYZ789",
        signature: "",
        keySecret: KEY_SECRET,
      }),
    ).toBe(false);

    expect(
      verifyRazorpaySignature({
        orderId: "order_ABC123",
        paymentId: "pay_XYZ789",
        signature: "not-hex-at-all!!",
        keySecret: KEY_SECRET,
      }),
    ).toBe(false);
  });

  it("is sensitive to which ids were signed (no cross-order replay)", () => {
    const signatureForOrderA = signFor("order_AAA", "pay_XYZ789");

    expect(
      verifyRazorpaySignature({
        orderId: "order_BBB",
        paymentId: "pay_XYZ789",
        signature: signatureForOrderA,
        keySecret: KEY_SECRET,
      }),
    ).toBe(false);
  });
});
