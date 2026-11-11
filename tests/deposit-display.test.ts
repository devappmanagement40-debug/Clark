import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeDepositDisplayText } from "../client/src/lib/deposit-display";

test("customer-facing payment errors replace provider names with CATL", () => {
  assert.equal(
    sanitizeDepositDisplayText("Clapay : connexion impossible", "fallback"),
    "CATL : connexion impossible",
  );
});

test("customer-facing deposit text keeps its fallback when the message is empty", () => {
  assert.equal(sanitizeDepositDisplayText("", "CATL ne peut pas continuer."), "CATL ne peut pas continuer.");
});
