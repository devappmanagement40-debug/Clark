import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getCountryByCode } from "@/lib/countries";
import { DuluxProductCard, type DuluxProductCardProduct } from "@/components/dulux-product-card";
import duluxProduct1 from "@/assets/images/home-products/dulux-product-1.webp";
import duluxProduct2 from "@/assets/images/home-products/dulux-product-2.webp";
import duluxProduct3 from "@/assets/images/home-products/dulux-product-3.webp";
import "./income.css";

interface IncomeTransaction {
  id: number;
  type: string;
  amount: string | number;
  description: string;
  createdAt: string;
}

interface PurchasedProduct {
  id: number;
  productId: number;
  purchasedAt: string;
  daysRemaining: number;
  totalEarned: string | number;
  status: "active" | "completed";
  product: DuluxProductCardProduct;
}

const productFallbackImages = [duluxProduct1, duluxProduct2, duluxProduct3] as const;

const incomeTypes = new Set([
  "earning",
  "commission",
  "deposit_commission",
  "task_reward",
  "gift_code",
  "wheel_reward",
  "admin_adjustment",
]);

function formatDate(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function IncomePage() {
  const { user } = useAuth();
  const {
    data: purchasedProducts = [],
    isLoading: productsLoading,
    isError: productsError,
    refetch: refetchProducts,
  } = useQuery<PurchasedProduct[]>({
    queryKey: ["/api/user/products"],
    enabled: !!user,
    staleTime: 0,
  });
  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    isError: transactionsError,
    refetch: refetchTransactions,
  } = useQuery<IncomeTransaction[]>({
    queryKey: ["/api/transactions"],
    enabled: !!user,
  });

  if (!user) return null;

  const currency = getCountryByCode(user.country)?.currency || "XOF";
  const formatMoney = (amount: number) =>
    `${amount.toLocaleString("fr-FR")} ${currency === "XOF" || currency === "XAF" ? "FCFA" : currency}`;
  const purchasedProductGroups = Array.from(
    purchasedProducts.reduce((groups, userProduct) => {
      const productId = userProduct.productId ?? userProduct.product?.id;
      if (productId === undefined || productId === null) return groups;
      const existing = groups.get(productId);
      if (existing) {
        existing.quantity += 1;
        existing.totalEarned += Number(userProduct.totalEarned) || 0;
      } else {
        groups.set(productId, {
          productId,
          product: userProduct.product,
          quantity: 1,
          totalEarned: Number(userProduct.totalEarned) || 0,
        });
      }
      return groups;
    }, new Map<number, {
      productId: number;
      product: DuluxProductCardProduct;
      quantity: number;
      totalEarned: number;
    }>()).values(),
  );
  const incomeTransactions = transactions
    .filter((transaction) => {
      const amount = Number(transaction.amount);
      return incomeTypes.has(transaction.type) && Number.isFinite(amount) && amount > 0;
    })
    .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime());
  const isLoading = productsLoading || transactionsLoading;
  const isError = productsError || transactionsError;

  return (
    <main className="income-page">
      <header className="income-header">
        <h1>Revenus</h1>
      </header>
      <div className="income-content">
        {isLoading ? (
          <div className="income-state" role="status" aria-label="Chargement des revenus">
            <Loader2 className="income-spinner" aria-hidden="true" />
          </div>
        ) : isError ? (
          <div className="income-state income-error" role="alert">
            <span>Impossible de charger les revenus.</span>
            <button
              type="button"
              onClick={() => {
                void refetchProducts();
                void refetchTransactions();
              }}
            >
              Réessayer
            </button>
          </div>
        ) : purchasedProductGroups.length === 0 && incomeTransactions.length === 0 ? (
          <p className="income-empty" role="status">NO DATA</p>
        ) : (
          <>
            {purchasedProductGroups.length > 0 ? (
              <section className="income-section" aria-labelledby="income-products-title">
                <h2 className="income-section-title" id="income-products-title">Produits achetés</h2>
                <div className="income-products-list">
                  {purchasedProductGroups.map((group, index) => {
                    const product: DuluxProductCardProduct = {
                      ...group.product,
                      id: group.productId,
                      name: group.product?.name || "Produit Dulux",
                      price: group.product?.price ?? 0,
                      dailyEarnings: group.product?.dailyEarnings ?? 0,
                      cycleDays: group.product?.cycleDays ?? 0,
                      totalReturn: group.product?.totalReturn ?? 0,
                      purchaseLimitPerUser: undefined,
                    };

                    return (
                      <DuluxProductCard
                        key={group.productId}
                        product={product}
                        imageFallback={productFallbackImages[index % productFallbackImages.length]}
                        formatMoney={formatMoney}
                        extraDetails={[
                          { label: "Quantité achetée", value: String(group.quantity) },
                          { label: "Total des gains reçus", value: formatMoney(group.totalEarned) },
                        ]}
                        testId={`income-purchased-product-${group.productId}`}
                      />
                    );
                  })}
                </div>
              </section>
            ) : null}
            {incomeTransactions.length > 0 ? (
              <section className="income-section" aria-labelledby="income-transactions-title">
                <h2 className="income-section-title" id="income-transactions-title">Historique des revenus</h2>
                <div className="income-list">
                  {incomeTransactions.map((transaction) => (
                    <article className="income-item" key={transaction.id}>
                      <div className="income-item-copy">
                        <p className="income-item-description">{transaction.description}</p>
                        <time dateTime={transaction.createdAt}>{formatDate(transaction.createdAt)}</time>
                      </div>
                      <strong>
                        +{Number(transaction.amount).toLocaleString("fr-FR")} {currency}
                      </strong>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
