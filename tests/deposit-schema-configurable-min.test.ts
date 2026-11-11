import assert from "node:assert/strict";
import test from "node:test";
import { depositSchema } from "../shared/schema";

test("deposit shape validation does not override the configured platform minimum", () => {
  const result = depositSchema.safeParse({
    amount: 1000,
    accountName: "Test Account",
    accountNumber: "0000000000",
    country: "TG",
    paymentMethod: "TMoney",
  });

  assert.equal(result.success, true);
});

test("deposit amount must still be positive", () => {
  const result = depositSchema.safeParse({
    amount: 0,
    accountName: "Test Account",
    accountNumber: "0000000000",
    country: "TG",
    paymentMethod: "TMoney",
  });

  assert.equal(result.success, false);
});
