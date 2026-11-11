import assert from "node:assert/strict";
import test from "node:test";
import { formatPublicTransactionId } from "../shared/public-transaction-id";

test("public transaction IDs are stable, readable, and type-scoped", () => {
  const depositId = formatPublicTransactionId("D", 12345);
  assert.equal(depositId, formatPublicTransactionId("D", 12345));
  assert.match(depositId, /^D[A-Z0-9]{16}$/);
  assert.notEqual(depositId, formatPublicTransactionId("R", 12345));
  assert.notEqual(depositId, formatPublicTransactionId("T", 12345));
});

test("public transaction IDs remain unique for each database record", () => {
  for (const kind of ["D", "R", "T"] as const) {
    const ids = new Set(Array.from({ length: 20_000 }, (_, index) =>
      formatPublicTransactionId(kind, index + 1),
    ));
    assert.equal(ids.size, 20_000);
  }
});

test("public transaction ID rejects invalid database IDs", () => {
  assert.throws(() => formatPublicTransactionId("D", -1), RangeError);
  assert.throws(() => formatPublicTransactionId("R", 1.5), RangeError);
});
