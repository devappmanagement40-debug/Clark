export interface DuluxProductCardProduct {
  id?: number | string;
  name: string;
  price: number | string;
  dailyEarnings: number | string;
  cycleDays: number | string;
  totalReturn: number | string;
  imageUrl?: string | null;
  purchaseLimitPerUser?: number | null;
  isActive?: boolean;
}

interface DuluxProductCardProps {
  product: DuluxProductCardProduct;
  imageFallback: string;
  formatMoney: (amount: number) => string;
  extraDetails?: Array<{ label: string; value: string }>;
  purchaseCount?: number;
  purchaseLimitReached?: boolean;
  buyDisabled?: boolean;
  buyLabel?: string;
  buyAriaLabel?: string;
  onBuy?: () => void;
  testId?: string;
}

export function DuluxProductCard({
  product,
  imageFallback,
  formatMoney,
  extraDetails,
  purchaseCount = 0,
  purchaseLimitReached = false,
  buyDisabled = false,
  buyLabel = "Acheter maintenant",
  buyAriaLabel,
  onBuy,
  testId,
}: DuluxProductCardProps) {
  const imageSrc = product.imageUrl?.trim() || imageFallback;
  const canBuy = typeof onBuy === "function";

  return (
    <article
      className={`cp-product-card${canBuy && product.isActive === false ? " is-unavailable" : ""}`}
      data-testid={testId}
    >
      <div className="cp-product-content">
        <div className="cp-product-visual">
          <img
            src={imageSrc}
            alt={`Produit Dulux : ${product.name}`}
            loading="lazy"
          />
          {product.purchaseLimitPerUser !== null && product.purchaseLimitPerUser !== undefined && (
            <span
              className="cp-product-purchase-count"
              aria-label={`${purchaseCount} achat(s) sur ${product.purchaseLimitPerUser} autorisé(s)`}
            >
              Times {purchaseCount}/{product.purchaseLimitPerUser}
            </span>
          )}
          <span className="cp-product-name">{product.name}</span>
        </div>
        <div className="cp-product-details">
          <div className="cp-product-detail">
            <span>Prix</span>
            <strong>{formatMoney(Number(product.price))}</strong>
          </div>
          <div className="cp-product-detail">
            <span>Profit journalier</span>
            <strong>{formatMoney(Number(product.dailyEarnings))}</strong>
          </div>
          <div className="cp-product-detail">
            <span>Jours</span>
            <strong>{Number(product.cycleDays).toLocaleString("fr-FR")}</strong>
          </div>
          <div className="cp-product-detail">
            <span>Profit total</span>
            <strong>{formatMoney(Number(product.totalReturn))}</strong>
          </div>
        </div>
      </div>
      {extraDetails?.length ? (
        <div className="cp-product-extra-details">
          {extraDetails.map((detail) => (
            <div className="cp-product-extra-detail" key={detail.label}>
              <span>{detail.label}</span>
              <strong>{detail.value}</strong>
            </div>
          ))}
        </div>
      ) : null}
      {onBuy && (
        <button
          className="cp-product-buy"
          type="button"
          onClick={onBuy}
          disabled={buyDisabled || purchaseLimitReached || product.isActive === false}
          aria-label={buyAriaLabel || `Acheter ${product.name}`}
        >
          {buyLabel}
        </button>
      )}
    </article>
  );
}
