export interface VipRankableProduct {
  id: number;
  sortOrder: number;
  isFree: boolean;
}

export function getPaidProductVipRanks(
  products: readonly VipRankableProduct[],
): Map<number, number> {
  const paidProducts = products
    .filter((product) => !product.isFree)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);

  return new Map(paidProducts.map((product, index) => [product.id, index + 1]));
}

export function getHighestPurchasedVipLevel(
  purchases: readonly { vipLevel?: number | null }[],
): number {
  return purchases.reduce(
    (highest, purchase) => Math.max(highest, purchase.vipLevel || 0),
    0,
  );
}
