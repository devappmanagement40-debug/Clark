import type { Deposit, Withdrawal } from "@shared/schema";
import { formatPublicTransactionId } from "@shared/public-transaction-id";

const DEPOSIT_PRIVATE_FIELDS = [
  "reference",
  "soleaspayReference",
  "soleaspayOrderId",
  "inpayOrderNumber",
  "inpayOutTradeNo",
  "omnipayId",
  "omnipayReference",
  "sendavapayReference",
  "sendavapayToken",
  "westpayReference",
  "ashtechTransactionId",
  "ashtechReference",
] as const;

const WITHDRAWAL_PRIVATE_FIELDS = [
  "inpayOrderNumber",
  "inpayOutTradeNo",
  "omnipayId",
  "omnipayReference",
] as const;

function omitPrivateFields<T extends object>(record: T, fields: readonly string[]) {
  const publicRecord = { ...record } as unknown as Record<string, unknown>;
  for (const field of fields) delete publicRecord[field];
  return publicRecord;
}

export function toPublicDepositHistoryItem(deposit: Deposit) {
  const hasSendavapayReference = Boolean(deposit.sendavapayReference);
  const canVerifyPayment = Boolean(
    !hasSendavapayReference &&
      (deposit.soleaspayReference ||
        deposit.soleaspayOrderId ||
        deposit.omnipayId ||
        deposit.omnipayReference),
  );

  return {
    ...omitPrivateFields(deposit, DEPOSIT_PRIVATE_FIELDS),
    publicReference: formatPublicTransactionId("D", deposit.id),
    canVerifyPayment,
  };
}

export function toPublicWithdrawalHistoryItem(withdrawal: Withdrawal) {
  return {
    ...omitPrivateFields(withdrawal, WITHDRAWAL_PRIVATE_FIELDS),
    publicReference: formatPublicTransactionId("R", withdrawal.id),
  };
}
