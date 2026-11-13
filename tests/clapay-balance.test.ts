import assert from "node:assert/strict";
import test from "node:test";
import { parseClapayCountryBalance } from "../server/clapay";

test("parses the documented country balance response", () => {
  assert.deepEqual(
    parseClapayCountryBalance({
      balance: 12500,
      deposit: 30000,
      withdrawal: 17500,
      potentialBalance: 900,
      possibleWithdrawal: 11600,
      update: "2026-11-13T10:30:00Z",
    }),
    {
      balance: 12500,
      deposit: 30000,
      withdrawal: 17500,
      potentialBalance: 900,
      possibleWithdrawal: 11600,
      update: "2026-11-13T10:30:00Z",
    },
  );
});

test("accepts numeric strings and a data-wrapped response", () => {
  assert.deepEqual(
    parseClapayCountryBalance({
      data: {
        balance: "12500.5",
        deposit: "30000",
        withdrawal: "17500",
        potentialBalance: "900",
        possibleWithdrawal: "11600",
      },
    }),
    {
      balance: 12500.5,
      deposit: 30000,
      withdrawal: 17500,
      potentialBalance: 900,
      possibleWithdrawal: 11600,
    },
  );
});

test("rejects incomplete or non-numeric balance responses", () => {
  assert.throws(
    () => parseClapayCountryBalance({ balance: 10 }),
    /incomplètes/,
  );
  assert.throws(
    () => parseClapayCountryBalance({ balance: "unknown" }),
    /incomplètes/,
  );
});
