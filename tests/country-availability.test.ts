import test from "node:test";
import assert from "node:assert/strict";
import { getCountriesForDisplay, type ApiCountry } from "../client/src/lib/countries.ts";

const country = (code: string, isActive: boolean): ApiCountry => ({
  id: code.length,
  code,
  name: code,
  currency: "XOF",
  phonePrefix: "000",
  operators: "[]",
  isActive,
});

test("country selectors only expose countries active in the API response", () => {
  const active = country("CI", true);
  const inactive = country("TG", false);

  assert.deepEqual(getCountriesForDisplay([active, inactive]), [active]);
});

test("country selectors fail closed when the active-country API is unavailable", () => {
  assert.deepEqual(getCountriesForDisplay(undefined, true), []);
});

test("an empty active-country response stays empty", () => {
  assert.deepEqual(getCountriesForDisplay([]), []);
});
