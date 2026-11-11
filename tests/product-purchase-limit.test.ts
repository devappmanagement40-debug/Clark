import assert from "node:assert/strict";
import test from "node:test";
import { isPurchaseLimitReached } from "../shared/product-purchase-limit";

test("unlimited products are not blocked by purchase count", () => {
  assert.equal(isPurchaseLimitReached(null, 0), false);
  assert.equal(isPurchaseLimitReached(undefined, 8), false);
});

test("purchase is allowed below the per-user limit", () => {
  assert.equal(isPurchaseLimitReached(1, 0), false);
  assert.equal(isPurchaseLimitReached(3, 2), false);
});

test("purchase is blocked at and above the per-user limit", () => {
  assert.equal(isPurchaseLimitReached(1, 1), true);
  assert.equal(isPurchaseLimitReached(3, 4), true);
});

test("invalid limits or counts fail closed", () => {
  assert.equal(isPurchaseLimitReached(0, 0), true);
  assert.equal(isPurchaseLimitReached(-1, 0), true);
  assert.equal(isPurchaseLimitReached(1, -1), true);
});
