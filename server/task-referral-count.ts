export type ReferralProductRecord = {
  userId: number;
  isFree: boolean;
  assignedByAdmin: boolean;
};

export function countPurchasedReferrals(
  referralIds: readonly number[],
  products: readonly ReferralProductRecord[],
): number {
  const directReferralIds = new Set(referralIds);
  const purchasers = new Set<number>();

  for (const product of products) {
    if (
      directReferralIds.has(product.userId)
      && !product.isFree
      && !product.assignedByAdmin
    ) {
      purchasers.add(product.userId);
    }
  }

  return purchasers.size;
}
