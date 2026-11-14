import assert from "node:assert/strict";
import test from "node:test";
import { getManualDepositPhoneRule, isValidManualDepositPayerPhone } from "../shared/manual-deposit-rules";

test("uses the expected national phone length for every currently active country", () => {
  const cases = [
    ["CI", "225", "0700000000", true],
    ["TG", "228", "90000000", true],
    ["BF", "226", "70000000", true],
    ["NE", "227", "90000000", true],
    ["BJ", "229", "0100000000", true],
  ] as const;

  for (const [country, prefix, nationalNumber, expected] of cases) {
    assert.equal(
      isValidManualDepositPayerPhone(country, prefix, `+${prefix}${nationalNumber}`),
      expected,
    );
  }
});

test("rejects a wrong country prefix and wrong fixed national length", () => {
  assert.equal(isValidManualDepositPayerPhone("CI", "225", "+22890000000"), false);
  assert.equal(isValidManualDepositPayerPhone("CI", "225", "+22570000000"), false);
});

test("allows a future country to use a five-to-fifteen digit national number", () => {
  assert.equal(isValidManualDepositPayerPhone("SN", "221", "+221771234567"), true);
  assert.equal(isValidManualDepositPayerPhone("SN", "221", "+2211234"), false);
  assert.equal(getManualDepositPhoneRule("SN"), undefined);
});
