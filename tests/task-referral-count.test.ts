import assert from "node:assert/strict";
import test from "node:test";
import { countPurchasedReferrals } from "../server/task-referral-count";

test("counts each referred user once after a paid product purchase", () => {
  assert.equal(
    countPurchasedReferrals(
      [10, 11, 12, 13],
      [
        { userId: 10, isFree: false, assignedByAdmin: false },
        { userId: 10, isFree: false, assignedByAdmin: false },
        { userId: 11, isFree: true, assignedByAdmin: false },
        { userId: 12, isFree: false, assignedByAdmin: true },
        { userId: 99, isFree: false, assignedByAdmin: false },
      ],
    ),
    1,
  );
});

test("does not count registrations or referrals without a paid purchase", () => {
  assert.equal(
    countPurchasedReferrals(
      [20, 21],
      [{ userId: 21, isFree: true, assignedByAdmin: false }],
    ),
    0,
  );
});
