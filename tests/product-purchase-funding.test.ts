import assert from "node:assert/strict";
import test from "node:test";
import { calculateProductPurchaseFunding } from "../shared/product-purchase-funding";

test("product purchase spends deposit balance first", () => {
  const funding = calculateProductPurchaseFunding(1500, 500, 300);

  assert.equal(funding.depositBalance, 1000);
  assert.equal(funding.earningsBalance, 500);
  assert.equal(funding.depositUsed, 300);
  assert.equal(funding.earningsUsed, 0);
  assert.equal(funding.canPurchase, true);
});

test("product purchase can combine deposits and withdrawable earnings", () => {
  const funding = calculateProductPurchaseFunding(1500, 500, 1200);

  assert.equal(funding.depositUsed, 1000);
  assert.equal(funding.earningsUsed, 200);
  assert.equal(funding.canPurchase, true);
});

test("insufficient combined balances do not allocate a debit", () => {
  const funding = calculateProductPurchaseFunding(600, 100, 700);

  assert.equal(funding.canPurchase, false);
  assert.equal(funding.depositUsed, 0);
  assert.equal(funding.earningsUsed, 0);
});

test("rejects inconsistent or invalid balance inputs", () => {
  assert.throws(() => calculateProductPurchaseFunding(100, 101, 50), RangeError);
  assert.throws(() => calculateProductPurchaseFunding(-1, 0, 50), RangeError);
  assert.throws(() => calculateProductPurchaseFunding(100, 20, Number.NaN), RangeError);
});
