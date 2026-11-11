export const DEFAULT_MINIMUM_DEPOSIT = 3000;
export const DEFAULT_MINIMUM_WITHDRAWAL = 1000;
export const DEFAULT_SIGNUP_BONUS = 500;
export const DEFAULT_WITHDRAWAL_FEE_PERCENT = 18;
export const DEFAULT_MAX_WITHDRAWALS_PER_DAY = 3;
export const DEFAULT_WITHDRAWAL_START_HOUR = 9;
export const DEFAULT_WITHDRAWAL_END_HOUR = 17;
export const DEFAULT_PURCHASE_COMMISSION_LEVEL1 = 28;
export const DEFAULT_PURCHASE_COMMISSION_LEVEL2 = 1;
export const DEFAULT_PURCHASE_COMMISSION_LEVEL3 = 1;
export const DEFAULT_WITHDRAWAL_PREPAYMENT_RATE = 25;
export const DEFAULT_DEPOSIT_COMMISSION_LEVEL1 = 5;
export const DEFAULT_DEPOSIT_COMMISSION_LEVEL2 = 2;
export const DEFAULT_DEPOSIT_COMMISSION_LEVEL3 = 1;
export const DEFAULT_HOME_WITHDRAWAL_PROCESSING_TEXT =
  "Généralement sous 2 heures, jusqu’à 24 heures exceptionnellement";
export const DEFAULT_WITHDRAWAL_PROCESSING_TEXT =
  "Les retraits sont traités sous 30 minutes à 24 heures ; vous recevrez {currency} {amount}.";

export const DEPOSIT_AMOUNT_PRESETS = [
  3000,
  8000,
  20000,
  50000,
  100000,
  200000,
  500000,
  1000000,
] as const;

export function readPositiveIntegerSetting(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function readPercentageSetting(
  value: unknown,
  fallback: number,
  minimum = 0,
): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= minimum && parsed <= 100 ? parsed : fallback;
}
