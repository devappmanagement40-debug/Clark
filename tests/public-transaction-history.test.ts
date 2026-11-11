import assert from "node:assert/strict";
import test from "node:test";
import { toPublicDepositHistoryItem, toPublicWithdrawalHistoryItem } from "../server/public-transaction-history";
import { formatPublicTransactionId } from "../shared/public-transaction-id";

test("public deposit history replaces provider references and omits payment tokens", () => {
  const deposit = {
    id: 456,
    userId: 12,
    amount: 5000,
    accountName: "Client",
    accountNumber: "TEST-ACCOUNT-001",
    country: "CI",
    paymentMethod: "Clapay — Wave",
    reference: "CLAPAY-1-private-signature",
    soleaspayReference: "DIRECTX-private-reference",
    soleaspayOrderId: "MERCHANT-ORDER-123",
    inpayOrderNumber: "INPAY-ORDER-123",
    inpayOutTradeNo: "INPAY-OUT-123",
    omnipayId: "OMNI-123",
    omnipayReference: "OMNI-REF-123",
    sendavapayReference: "SENDAVA-123",
    sendavapayToken: "PRIVATE-PAYMENT-TOKEN",
    westpayReference: "WESTPAY-123",
    ashtechTransactionId: "ASHTECH-123",
    ashtechReference: "ASHTECH-REF-123",
    status: "processing",
    createdAt: new Date("2026-10-15T12:00:00.000Z"),
    processedAt: null,
    processedBy: null,
  } as any;

  const publicItem = toPublicDepositHistoryItem(deposit);
  const serialized = JSON.stringify(publicItem);

  assert.equal(publicItem.publicReference, formatPublicTransactionId("D", deposit.id));
  assert.equal(publicItem.canVerifyPayment, false);
  for (const privateValue of [
    deposit.reference,
    deposit.soleaspayReference,
    deposit.soleaspayOrderId,
    deposit.inpayOrderNumber,
    deposit.inpayOutTradeNo,
    deposit.omnipayId,
    deposit.omnipayReference,
    deposit.sendavapayReference,
    deposit.sendavapayToken,
    deposit.westpayReference,
    deposit.ashtechTransactionId,
    deposit.ashtechReference,
  ]) {
    assert.equal(serialized.includes(privateValue), false);
  }
});

test("public deposit history retains the status-check action without exposing provider IDs", () => {
  const deposit = {
    id: 457,
    reference: "PROVIDER-SIGNATURE",
    soleaspayReference: "SOLEA-REFERENCE",
    status: "processing",
  } as any;

  const publicItem = toPublicDepositHistoryItem(deposit);

  assert.equal(publicItem.canVerifyPayment, true);
  assert.equal("soleaspayReference" in publicItem, false);
  assert.equal("reference" in publicItem, false);
});

test("public withdrawal history removes provider transaction references", () => {
  const withdrawal = {
    id: 789,
    userId: 12,
    amount: 5000,
    netAmount: 4200,
    fees: 800,
    accountName: "Client",
    accountNumber: "TEST-ACCOUNT-001",
    country: "CI",
    paymentMethod: "Clapay",
    status: "pending",
    inpayOrderNumber: "INPAY-ORDER-123",
    inpayOutTradeNo: "INPAY-OUT-123",
    omnipayId: "OMNI-123",
    omnipayReference: "OMNI-REF-123",
    createdAt: new Date("2026-10-15T12:00:00.000Z"),
    processedAt: null,
    processedBy: null,
  } as any;

  const publicItem = toPublicWithdrawalHistoryItem(withdrawal);
  const serialized = JSON.stringify(publicItem);

  assert.equal(publicItem.publicReference, formatPublicTransactionId("R", withdrawal.id));
  for (const privateValue of [
    withdrawal.inpayOrderNumber,
    withdrawal.inpayOutTradeNo,
    withdrawal.omnipayId,
    withdrawal.omnipayReference,
  ]) {
    assert.equal(serialized.includes(privateValue), false);
  }
});
