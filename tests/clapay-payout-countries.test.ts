import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_CLAPAY_PAYOUT_COUNTRIES,
  deriveClapayPayoutCountries,
  deriveClapayRoutedCountries,
  parseClapayPayoutCountries,
} from "../shared/clapay-payout-countries";

test("derives payout countries from active Clapay deposit routing", () => {
  assert.deepEqual(
    deriveClapayPayoutCountries(
      [
        { code: "CI", isActive: true },
        { code: "BJ", isActive: true },
        { code: "TG", isActive: true },
        { code: "BF", isActive: false },
        { code: "TCH", isActive: true },
      ],
      { CI: ["manual", "clapay"], BJ: ["clapay"], TG: ["manual"], BF: ["clapay"], TCH: ["clapay"] },
      true,
    ),
    ["CI", "BJ"],
  );
});

test("does not derive payout countries while Clapay is globally disabled", () => {
  assert.deepEqual(
    deriveClapayPayoutCountries(
      [{ code: "CI", isActive: true }],
      { CI: ["clapay"] },
      false,
    ),
    [],
  );
});

test("keeps routed countries available for balance checks while payouts are disabled", () => {
  assert.deepEqual(
    deriveClapayRoutedCountries(
      [
        { code: "CI", isActive: true },
        { code: "BJ", isActive: true },
        { code: "BF", isActive: false },
      ],
      { ci: ["clapay"], BJ: ["manual"], BF: ["clapay"] },
    ),
    ["CI"],
  );
});

test("keeps the existing Clapay payout countries when no setting exists", () => {
  assert.deepEqual(parseClapayPayoutCountries(undefined), ["NE", "BF"]);
  assert.deepEqual(parseClapayPayoutCountries(""), ["NE", "BF"]);
  assert.deepEqual(DEFAULT_CLAPAY_PAYOUT_COUNTRIES, ["NE", "BF"]);
});

test("normalizes and deduplicates administrator country selections", () => {
  assert.deepEqual(
    parseClapayPayoutCountries('["bf","NE","BF"]'),
    ["BF", "NE"],
  );
});

test("allows an explicit empty list to disable all Clapay payouts", () => {
  assert.deepEqual(parseClapayPayoutCountries("[]"), []);
});

test("rejects malformed or non-country configuration", () => {
  assert.throws(() => parseClapayPayoutCountries("{"), /configuration.*invalide/i);
  assert.throws(() => parseClapayPayoutCountries('{"BF":true}'), /liste JSON/i);
  assert.throws(() => parseClapayPayoutCountries('["TCH"]'), /Code pays.*invalide/i);
});
