import test from "node:test";
import assert from "node:assert/strict";
import {
  getActiveCountryMethodNames,
  hasConfiguredCountryMethods,
  normalizeCountryCode,
  parseCountryMethodEntries,
} from "../shared/country-methods.ts";
import { parseDepositMethodsByCountry } from "../shared/deposit-method-routing.ts";
import {
  isDepositOperatorSelected,
  parseDepositOperatorsByCountry,
} from "../shared/deposit-operator-routing.ts";
import { getWithdrawalMethods, isAllowedWithdrawalMethod } from "../shared/withdrawal-methods.ts";

test("legacy country operator arrays remain active", () => {
  assert.deepEqual(
    getActiveCountryMethodNames('["Airtel Money","Moov"]'),
    ["Airtel Money", "Moov"],
  );
});

test("country methods can be disabled without deleting their configuration", () => {
  const stored = JSON.stringify([
    { name: "Airtel Money", isActive: true },
    { name: "Moov", isActive: false },
  ]);

  assert.deepEqual(parseCountryMethodEntries(stored), [
    { name: "Airtel Money", isActive: true },
    { name: "Moov", isActive: false },
  ]);
  assert.deepEqual(getActiveCountryMethodNames(stored), ["Airtel Money"]);
  assert.equal(hasConfiguredCountryMethods(stored), true);
});

test("malformed country method data fails closed", () => {
  assert.deepEqual(getActiveCountryMethodNames("{broken"), []);
  assert.equal(hasConfiguredCountryMethods("{broken"), false);
});

test("country codes are normalized and support two- or three-letter codes", () => {
  assert.equal(normalizeCountryCode(" rwa "), "RWA");
  assert.equal(normalizeCountryCode("ci"), "CI");
  assert.equal(normalizeCountryCode("C1"), undefined);
  assert.equal(normalizeCountryCode("TOGO"), undefined);
});

test("deposit routing accepts a newly added three-letter country", () => {
  assert.deepEqual(
    parseDepositMethodsByCountry('{" rwa ":["manual","clapay","manual"]}'),
    { RWA: ["manual", "clapay"] },
  );
});

test("deposit routing rejects unknown methods and invalid country codes", () => {
  assert.throws(
    () => parseDepositMethodsByCountry('{"C1":["manual"]}'),
    /Configuration de dépôt invalide/,
  );
  assert.throws(
    () => parseDepositMethodsByCountry('{"RWA":["unknown"]}'),
    /Méthode de dépôt inconnue/,
  );
});

test("deposit operator selections normalize countries and deduplicate identifiers", () => {
  const config = parseDepositOperatorsByCountry(
    '{" bf ":{"clapay":["OM","OM"],"sendavapay":["orange"]}}',
  );
  assert.deepEqual(config, {
    BF: {
      clapay: ["OM"],
      sendavapay: ["orange"],
    },
  });
});

test("deposit operator selection distinguishes missing configuration from disabled operators", () => {
  const config = parseDepositOperatorsByCountry('{"BF":{"clapay":[]}}');
  assert.equal(isDepositOperatorSelected(config, "BF", "clapay", "OM"), false);
  assert.equal(isDepositOperatorSelected(config, "BF", "clapay", "OM", true), false);
  assert.equal(isDepositOperatorSelected(config, "NE", "clapay", "OM", false), false);
  assert.equal(isDepositOperatorSelected(config, "NE", "clapay", "OM"), true);
});

test("deposit operator routing rejects malformed providers and operator identifiers", () => {
  assert.throws(
    () => parseDepositOperatorsByCountry('{"BF":{"unknown":["x"]}}'),
    /Fournisseur d’opérateurs inconnu/,
  );
  assert.throws(
    () => parseDepositOperatorsByCountry('{"BF":{"clapay":[""]}}'),
    /Identifiant d’opérateur invalide/,
  );
});

test("withdrawal methods are determined by country configuration, not country-code overrides", () => {
  assert.deepEqual(getWithdrawalMethods("CI", ["Moov"]), ["Moov"]);
  assert.equal(isAllowedWithdrawalMethod("CI", "Wave", ["Moov"]), false);
  assert.equal(isAllowedWithdrawalMethod("TD", "Airtel Money", ["Airtel Money", "Moov"]), true);
});
