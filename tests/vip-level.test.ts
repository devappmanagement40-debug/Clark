import test from "node:test";
import assert from "node:assert/strict";
import { getHighestPurchasedVipLevel, getPaidProductVipRanks } from "../shared/vip-level";

const productRanks = getPaidProductVipRanks([
  { id: 20, sortOrder: 0, isFree: false },
  { id: 21, sortOrder: 0, isFree: false },
  { id: 22, sortOrder: -1, isFree: true },
  { id: 23, sortOrder: 3, isFree: false },
]);

test("paid product catalog order determines the VIP rank", () => {
  assert.equal(productRanks.get(20), 1);
  assert.equal(productRanks.get(21), 2);
  assert.equal(productRanks.get(23), 3);
  assert.equal(productRanks.has(22), false);
});

test("profile VIP is the highest ranked purchased paid product", () => {
  assert.equal(getHighestPurchasedVipLevel([{ vipLevel: productRanks.get(20) }]), 1);
  assert.equal(getHighestPurchasedVipLevel([{ vipLevel: productRanks.get(21) }]), 2);
  assert.equal(
    getHighestPurchasedVipLevel([
      { vipLevel: productRanks.get(23) },
      { vipLevel: productRanks.get(20) },
    ]),
    3,
  );
  assert.equal(getHighestPurchasedVipLevel([{ vipLevel: 0 }]), 0);
  assert.equal(getHighestPurchasedVipLevel([]), 0);
});
