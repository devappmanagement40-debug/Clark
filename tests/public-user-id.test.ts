import assert from "node:assert/strict";
import test from "node:test";
import { formatPublicUserId } from "../shared/public-user-id";

test("public user IDs start at 8952 and increase uniquely", () => {
  assert.equal(formatPublicUserId(1), "8952");
  assert.equal(formatPublicUserId(2), "8953");
  assert.equal(formatPublicUserId(1492), "10443");
});

test("public user IDs reject invalid internal identifiers", () => {
  for (const id of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => formatPublicUserId(id), RangeError);
  }
});
