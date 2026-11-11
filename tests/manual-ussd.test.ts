import assert from "node:assert/strict";
import test from "node:test";
import { buildTogocelManualUssdCode } from "../client/src/lib/manual-ussd";

test("builds the TMoney USSD code from the current admin-configured phone", () => {
  assert.equal(
    buildTogocelManualUssdCode({
      countryCode: "TG",
      operatorName: "TMoney",
      amount: 5000,
      recipientPhone: "00000000",
      countryPhonePrefix: "+228",
    }),
    "*145*5*5000*00000000#",
  );
  assert.equal(
    buildTogocelManualUssdCode({
      countryCode: "TG",
      operatorName: "TMoney",
      amount: 5000,
      recipientPhone: "00000001",
      countryPhonePrefix: "+228",
    }),
    "*145*5*5000*00000001#",
  );
  assert.equal(
    buildTogocelManualUssdCode({
      countryCode: "TG",
      operatorName: "Yas Togo (Togocel)",
      amount: 8000,
      recipientPhone: "+22800000002",
      countryPhonePrefix: "+228",
    }),
    "*145*5*8000*00000002#",
  );
});

test("does not show a Togocel USSD shortcut for other countries, links, or empty numbers", () => {
  const base = {
    operatorName: "TMoney",
    amount: 5000,
    recipientPhone: "00000000",
    countryPhonePrefix: "+228",
  };
  assert.equal(buildTogocelManualUssdCode({ ...base, countryCode: "BJ" }), "");
  assert.equal(buildTogocelManualUssdCode({ ...base, countryCode: "TG", paymentLink: "https://pay.example" }), "");
  assert.equal(buildTogocelManualUssdCode({ ...base, countryCode: "TG", recipientPhone: null }), "");
});
