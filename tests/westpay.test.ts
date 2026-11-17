import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import {
  validateWestpayDepositConfig,
  verifyWebhookSignature,
} from "../server/westpay";

test("deposit configuration does not require the unused payout API URL", () => {
  const envNames = [
    "WESTPAY_API_BASE_URL",
    "WESTPAY_CHECKOUT_BASE_URL",
    "WESTPAY_MERCHANT_SLUG",
    "WESTPAY_WEBHOOK_SECRET",
  ] as const;
  const originalValues = new Map(envNames.map((name) => [name, process.env[name]]));

  try {
    for (const name of envNames) delete process.env[name];
    process.env.WESTPAY_CHECKOUT_BASE_URL = "https://checkout.example.test/pay";
    process.env.WESTPAY_MERCHANT_SLUG = "merchant-test";
    process.env.WESTPAY_WEBHOOK_SECRET = "webhook-test-secret";

    assert.doesNotThrow(() => validateWestpayDepositConfig());
  } finally {
    for (const [name, value] of originalValues) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});

test("validates WestPay signatures against the exact raw webhook body", () => {
  const rawBody = Buffer.from('{"event":"payment.confirmed","txId":"wp-test-123"}');
  const secret = "westpay-test-secret";
  const hexSignature = createHmac("sha256", secret).update(rawBody).digest("hex");
  const base64Signature = createHmac("sha256", secret).update(rawBody).digest("base64");

  assert.equal(verifyWebhookSignature(rawBody, hexSignature, secret), true);
  assert.equal(verifyWebhookSignature(rawBody, `sha256=${base64Signature}`, secret), true);
  assert.equal(verifyWebhookSignature(rawBody, "invalid", secret), false);
  assert.equal(verifyWebhookSignature(undefined, hexSignature, secret), false);
  assert.equal(verifyWebhookSignature(rawBody, hexSignature, ""), false);
});
