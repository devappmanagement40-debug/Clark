import assert from "node:assert/strict";
import test from "node:test";
import type { PaymentNumber } from "../shared/schema";
import { getManualDepositOperatorChoices } from "../client/src/lib/manual-deposit-options";

function paymentNumber(id: number, country: string, operatorName: string): PaymentNumber {
  return {
    id,
    ownerName: "Marchand",
    phone: "+2250700000000",
    paymentLink: null,
    operatorName,
    country,
    logoUrl: null,
    qrImageUrl: null,
    isActive: true,
    createdAt: new Date(0),
    createdBy: null,
  };
}

test("shows configured Côte d’Ivoire Wave numbers when its operator catalog is empty", () => {
  const wave = paymentNumber(1, "CI", "Wave");
  const choices = getManualDepositOperatorChoices("CI", [], [wave]);
  assert.equal(choices.length, 1);
  assert.equal(choices[0].name, "Wave");
  assert.equal(choices[0].manualNumber, wave);
});

test("keeps country-configured operators visible when receiver coordinates are missing", () => {
  const choices = getManualDepositOperatorChoices("TG", ["TMoney"], []);
  assert.equal(choices.length, 1);
  assert.equal(choices[0].name, "Togocel");
  assert.equal(choices[0].manualNumber, undefined);
});

test("matches configured operator names to saved country numbers", () => {
  const moov = paymentNumber(2, "BJ", "Moov Africa Bénin");
  const choices = getManualDepositOperatorChoices("BJ", ["MTN Bénin", "Moov"], [moov]);
  assert.deepEqual(choices.map(({ name, manualNumber }) => ({ name, manualNumber })), [
    { name: "MTN Bénin", manualNumber: undefined },
    { name: "Moov Africa Bénin", manualNumber: moov },
  ]);
});
