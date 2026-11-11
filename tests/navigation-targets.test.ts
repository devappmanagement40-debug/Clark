import assert from "node:assert/strict";
import test from "node:test";
import {
  getHistoryBackPath,
  getHistoryTabPath,
  getWalletBackPath,
  getWithdrawalBackPath,
} from "../client/src/lib/navigation-targets";

test("history returns to its entry page and preserves the deposit context between tabs", () => {
  assert.equal(getHistoryBackPath("?from=deposit"), "/my-page/deposit");
  assert.equal(getHistoryBackPath(""), "/my-page/account");
  assert.equal(getHistoryTabPath("income", "?from=deposit"), "/my-page/history?from=deposit");
  assert.equal(getHistoryTabPath("withdrawals", "?from=deposit"), "/my-page/withdrawal-history?from=deposit");
  assert.equal(getHistoryTabPath("deposits", ""), "/my-page/deposits-history");
});

test("withdrawal returns to the wallet selector when that was the caller", () => {
  assert.equal(getWithdrawalBackPath("?from=wallet"), "/my-page/wallet");
  assert.equal(getWithdrawalBackPath(""), "/my-page/home");
});

test("wallet returns to the page that opened it", () => {
  assert.equal(getWalletBackPath("?from=home"), "/my-page/home");
  assert.equal(getWalletBackPath("?from=gift-code"), "/my-page/gift-code");
  assert.equal(getWalletBackPath("?from=withdrawal"), "/my-page/withdrawal");
  assert.equal(getWalletBackPath(""), "/my-page/account");
});
