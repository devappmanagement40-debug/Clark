import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import {
  isClapayConfigured,
  verifyClapayWebhookSignature,
} from "../server/clapay";

const clapayEnvNames = [
  "CLAPAY_BASE_URL",
  "CLAPAY_API_TOKEN",
  "CLAPAY_SECRET_KEY",
  "CLAPAY_PUBLIC_KEY",
  "CLAPAY_API_BASE_URL",
  "CLAPAY_API_KEY",
  "CLAPAY_WEBHOOK_SECRET",
  "CLAPAY_WEBHOOK_UNIQUE_KEY",
] as const;

test("accepts the four Clapay environment variable names configured in Plesk", () => {
  const originalValues = new Map(
    clapayEnvNames.map((name) => [name, process.env[name]]),
  );
  try {
    for (const name of clapayEnvNames) delete process.env[name];

    const baseUrl = "https://clapay.example.test/nowallet/api";
    const apiToken = "test-api-token";
    const secretKey = "test-secret-key";
    const publicKey = "test-public-key";
    process.env.CLAPAY_BASE_URL = baseUrl;
    process.env.CLAPAY_API_TOKEN = apiToken;
    process.env.CLAPAY_SECRET_KEY = secretKey;
    process.env.CLAPAY_PUBLIC_KEY = publicKey;

    assert.equal(isClapayConfigured(), true);

    const body = { status: "SUCCESSFUL", reference: "test-reference" };
    const key = "test-webhook-key";
    const encryptedKey = createHmac("sha256", publicKey).update(key).digest("hex");
    const signature = createHmac("sha256", secretKey)
      .update(`${encryptedKey}${JSON.stringify(body)}`)
      .digest("hex");

    assert.equal(
      verifyClapayWebhookSignature(body, `key=${key},signature=${signature}`),
      true,
    );
  } finally {
    for (const [name, value] of originalValues) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
