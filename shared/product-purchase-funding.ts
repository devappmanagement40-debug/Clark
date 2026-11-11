export interface ProductPurchaseFunding {
  totalBalance: number;
  depositBalance: number;
  earningsBalance: number;
  productPrice: number;
  depositUsed: number;
  earningsUsed: number;
  canPurchase: boolean;
}

function toCents(amount: number, label: string): number {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new RangeError(`${label} must be a finite, non-negative amount`);
  }
  return Math.round(amount * 100);
}

function fromCents(amount: number): number {
  return amount / 100;
}

/**
 * Purchases use non-withdrawable deposits first, then withdrawable earnings.
 * The account stores a combined balance, so the two available buckets are
 * derived from the total balance and the server-computed withdrawable amount.
 */
export function calculateProductPurchaseFunding(
  totalBalance: number,
  withdrawableBalance: number,
  productPrice: number,
): ProductPurchaseFunding {
  const totalCents = toCents(totalBalance, "Total balance");
  const earningsCents = toCents(withdrawableBalance, "Withdrawable balance");
  const priceCents = toCents(productPrice, "Product price");

  if (earningsCents > totalCents) {
    throw new RangeError("Withdrawable balance cannot exceed total balance");
  }

  const depositCents = totalCents - earningsCents;
  const canPurchase = priceCents <= totalCents;
  const depositUsedCents = canPurchase ? Math.min(priceCents, depositCents) : 0;
  const earningsUsedCents = canPurchase ? priceCents - depositUsedCents : 0;

  return {
    totalBalance: fromCents(totalCents),
    depositBalance: fromCents(depositCents),
    earningsBalance: fromCents(earningsCents),
    productPrice: fromCents(priceCents),
    depositUsed: fromCents(depositUsedCents),
    earningsUsed: fromCents(earningsUsedCents),
    canPurchase,
  };
}
