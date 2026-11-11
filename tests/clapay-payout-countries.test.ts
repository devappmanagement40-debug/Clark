import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_CLAPAY_PAYOUT_COUNTRIES,
  parseClapayPayoutCountries,
} from "../shared/clapay-payout-countries";

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
