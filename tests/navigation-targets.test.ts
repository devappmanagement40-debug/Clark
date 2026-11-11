import assert from "node:assert/strict";
import test from "node:test";
import {
  getHistoryBackPath,
  getHistoryTabPath,
  getWalletBackPath,
  getWithdrawalBackPath,
} from "../client/src/lib/navigation-targets";

test("history returns to its entry page and preserves the deposit context between tabs", () => {
  assert.equal(getHistoryBackPath("?from=deposit"), "/deposit");
  assert.equal(getHistoryBackPath(""), "/account");
  assert.equal(getHistoryTabPath("income", "?from=deposit"), "/history?from=deposit");
  assert.equal(getHistoryTabPath("withdrawals", "?from=deposit"), "/withdrawal-history?from=deposit");
  assert.equal(getHistoryTabPath("deposits", ""), "/deposits-history");
});

test("withdrawal returns to the wallet selector when that was the caller", () => {
  assert.equal(getWithdrawalBackPath("?from=wallet"), "/wallet");
  assert.equal(getWithdrawalBackPath(""), "/");
});

test("wallet returns to the page that opened it", () => {
  assert.equal(getWalletBackPath("?from=home"), "/");
  assert.equal(getWalletBackPath("?from=gift-code"), "/gift-code");
  assert.equal(getWalletBackPath("?from=withdrawal"), "/withdrawal");
  assert.equal(getWalletBackPath(""), "/account");
});
