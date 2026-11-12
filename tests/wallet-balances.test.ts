import assert from "node:assert/strict";
import test from "node:test";
import {
  allocateEarningsWithdrawal,
  allocatePurchase,
  deriveWalletBalances,
  getTotalIncomeCredit,
  sumRecordedIncomeCredits,
} from "../shared/wallet-balances";

test("derives historical wallet split without changing the pooled total", () => {
  const wallets = deriveWalletBalances({
    totalBalance: "1200.00",
    persistentDepositBalance: "0",
    persistentEarningsBalance: "0",
    approvedLegacyDepositPrincipal: "900",
    historicalProductSpending: "300",
    postActivationLegacyDepositDelta: "0",
  });

  assert.equal(wallets.totalBalance, 1200);
  assert.equal(wallets.depositBalance, 600);
  assert.equal(wallets.earningsBalance, 600);
});

test("routes a deposit credit to the deposit wallet and other credits to earnings", () => {
  const wallets = deriveWalletBalances({
    totalBalance: "1500",
    persistentDepositBalance: "250",
    persistentEarningsBalance: "150",
    approvedLegacyDepositPrincipal: "900",
    historicalProductSpending: "300",
    postActivationLegacyDepositDelta: "0",
  });

  assert.equal(wallets.depositBalance, 850);
  assert.equal(wallets.earningsBalance, 650);
});

test("purchase consumes deposit funds first, then withdrawable earnings", () => {
  const wallets = deriveWalletBalances({
    totalBalance: "1000",
    persistentDepositBalance: "200",
    persistentEarningsBalance: "100",
    approvedLegacyDepositPrincipal: "600",
    historicalProductSpending: "100",
    postActivationLegacyDepositDelta: "0",
  });
  const allocation = allocatePurchase(wallets, 850);

  assert.equal(allocation.canSpend, true);
  assert.equal(allocation.depositDelta, -700);
  assert.equal(allocation.earningsDelta, -150);
  assert.equal(allocation.persistentDepositDelta, -200);
  assert.equal(allocation.persistentEarningsDelta, 0);
  assert.equal(allocation.legacyDepositDelta, -500);
  assert.equal(allocation.legacyEarningsDelta, -150);
});

test("withdrawal allocation only consumes earnings and rejects insufficient amount", () => {
  const wallets = deriveWalletBalances({
    totalBalance: "1000",
    persistentDepositBalance: "400",
    persistentEarningsBalance: "100",
    approvedLegacyDepositPrincipal: "350",
    historicalProductSpending: "100",
    postActivationLegacyDepositDelta: "0",
  });

  const allocation = allocateEarningsWithdrawal(wallets, 350);
  assert.equal(allocation.canSpend, true);
  assert.equal(allocation.depositDelta, 0);
  assert.equal(allocation.earningsDelta, -350);
  assert.equal(allocation.persistentEarningsDelta, -100);
  assert.equal(allocation.legacyEarningsDelta, -250);

  assert.equal(allocateEarningsWithdrawal(wallets, 351).canSpend, false);
});

test("only earnings credits increase cumulative income, not deposits or withdrawal refunds", () => {
  assert.equal(getTotalIncomeCredit("deposit", "deposit", 500), 0);
  assert.equal(getTotalIncomeCredit("earnings", "commission", 140), 140);
  assert.equal(getTotalIncomeCredit("earnings", "wheel_reward", 777), 777);
  assert.equal(getTotalIncomeCredit("earnings", "withdrawal_refund", 200), 0);
  assert.equal(getTotalIncomeCredit("earnings", "earning", 70, 70), 70);
});

test("cumulative income includes withdrawable ledger credits but excludes deposits and refunds", () => {
  const total = sumRecordedIncomeCredits([
    {
      type: "earning",
      amount: "70",
      walletImpact: JSON.stringify({ depositDelta: 0, earningsDelta: 70, legacyEarningsDelta: 0 }),
    },
    {
      type: "commission",
      amount: "28",
      walletImpact: JSON.stringify({ depositDelta: 0, earningsDelta: 28, legacyEarningsDelta: 0 }),
    },
    {
      type: "wheel_reward",
      amount: "777",
      walletImpact: JSON.stringify({ depositDelta: 0, earningsDelta: 777, legacyEarningsDelta: 0 }),
    },
    {
      type: "admin_adjustment",
      amount: "500",
      walletImpact: JSON.stringify({ depositDelta: 500, earningsDelta: 0, legacyEarningsDelta: 0 }),
    },
    {
      type: "admin_adjustment",
      amount: "30",
      walletImpact: JSON.stringify({ depositDelta: 0, earningsDelta: 30, legacyEarningsDelta: 0 }),
    },
    {
      type: "withdrawal_refund",
      amount: "100",
      walletImpact: JSON.stringify({ depositDelta: 0, earningsDelta: 100, legacyEarningsDelta: 0 }),
    },
    { type: "task_reward", amount: "25", walletImpact: null },
    { type: "bonus", amount: "500", walletImpact: null },
  ]);

  assert.equal(total, 930);
});
