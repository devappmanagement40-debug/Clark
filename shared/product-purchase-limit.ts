export function isPurchaseLimitReached(
  purchaseLimitPerUser: number | null | undefined,
  purchaseCount: number,
): boolean {
  if (purchaseLimitPerUser === null || purchaseLimitPerUser === undefined) return false;
  if (!Number.isSafeInteger(purchaseLimitPerUser) || purchaseLimitPerUser < 1) return true;
  if (!Number.isSafeInteger(purchaseCount) || purchaseCount < 0) return true;
  return purchaseCount >= purchaseLimitPerUser;
}
