import assert from "node:assert/strict";
import test from "node:test";
import {
  extractClapayConfirmationCode,
  findClapayConfirmationCandidatePaths,
} from "../server/clapay";

test("extracts a nested NITA confirmation code from Clapay's response", () => {
  assert.equal(
    extractClapayConfirmationCode({
      success: true,
      data: { confirmation_code: "  048219  " },
      signature: "merchant-transaction-signature",
    }),
    "048219",
  );
});

test("recognizes common confirmation-code field names without exposing signatures", () => {
  assert.equal(
    extractClapayConfirmationCode({ result: { paymentCode: 638204 } }),
    "638204",
  );
  assert.equal(
    extractClapayConfirmationCode({ code: "200", signature: "transaction-reference" }),
    undefined,
  );
});

test("extracts Clapay's documented payment_otp response field for NITA Niger", () => {
  assert.equal(
    extractClapayConfirmationCode({
      signature: "merchant-status-signature",
      payment_otp: "ACHATA80C9C2EA5763",
    }, "", { allowNitaReference: true }),
    "ACHATA80C9C2EA5763",
  );
});

test("does not expose the NITA payment_otp field in other Clapay flows", () => {
  assert.equal(
    extractClapayConfirmationCode({ payment_otp: "ACHATA80C9C2EA5763" }),
    undefined,
  );
});

test("uses the configured response path when Clapay names the code differently", () => {
  assert.equal(
    extractClapayConfirmationCode(
      { result: { nita_receipt: { ticket: "NT-827341" } } },
      "result.nita_receipt.ticket",
    ),
    "NT-827341",
  );
});

test("extracts the customer reference returned for a NITA Niger deposit", () => {
  assert.equal(
    extractClapayConfirmationCode(
      {
        data: { reference: "ACHATA80C9C2EA5763" },
        signature: "merchant-status-signature",
      },
      "",
      {
        allowNitaReference: true,
        excludedValues: ["merchant-status-signature", "CLAPAY-123-456"],
      },
    ),
    "ACHATA80C9C2EA5763",
  );
});

test("does not treat generic references as customer codes outside the NITA flow", () => {
  assert.equal(
    extractClapayConfirmationCode({ data: { reference: "ACHATA80C9C2EA5763" } }),
    undefined,
  );
});

test("does not expose the merchant signature or order reference as a NITA code", () => {
  assert.equal(
    extractClapayConfirmationCode(
      {
        data: { reference: "CLAPAY-123-456" },
        signature: "merchant-status-signature",
      },
      "",
      {
        allowNitaReference: true,
        excludedValues: ["merchant-status-signature", "CLAPAY-123-456"],
      },
    ),
    undefined,
  );
});

test("does not treat the platform's Clapay order ID as a NITA confirmation code", () => {
  assert.equal(
    extractClapayConfirmationCode(
      { data: { reference: "CLAPAY-123-456" } },
      "",
      { allowNitaReference: true },
    ),
    undefined,
  );
});

test("ignores empty, oversized, and non-scalar confirmation values", () => {
  assert.equal(extractClapayConfirmationCode({ confirmation_code: " " }), undefined);
  assert.equal(extractClapayConfirmationCode({ confirmation_code: "x".repeat(81) }), undefined);
  assert.equal(extractClapayConfirmationCode({ confirmation_code: { value: "1234" } }), undefined);
});

test("confirmation diagnostics return provider field paths without their values", () => {
  assert.deepEqual(
    findClapayConfirmationCandidatePaths({
      data: { payment_ref: "ACHATA80C9C2EA5763" },
      signature: "do-not-log",
    }),
    ["data.payment_ref"],
  );
});
