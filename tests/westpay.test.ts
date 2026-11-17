import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { verifyWebhookSignature } from "../server/westpay";

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
