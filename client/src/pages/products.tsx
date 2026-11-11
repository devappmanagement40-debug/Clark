import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getCountryByCode } from "@/lib/countries";
import { isPurchaseLimitReached } from "@shared/product-purchase-limit";
import { AlertTriangle, BatteryCharging, ChevronRight, Loader2, ShoppingBag, Wallet, X } from "lucide-react";
import { useLocation } from "wouter";
import { calculateProductPurchaseFunding } from "@shared/product-purchase-funding";
import type { Product } from "@shared/schema";
import equipmentIcon from "@assets/IMG_20260829_070948_545_1791818775118.jpg";
import revenueIcon from "@assets/IMG_20260829_070922_702_1791818835262.jpg";

interface ProductWithOwnership extends Product {
  isOwned: boolean;
  canClaimFree: boolean;
  ownedCount?: number;
  purchaseCount?: number;
}

export default function ProductsPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedProduct, setSelectedProduct] = useState<ProductWithOwnership | null>(null);
  const purchaseDialogRef = useRef<HTMLDivElement | null>(null);
  const purchasePendingRef = useRef(false);
  const productLaunchHandledRef = useRef(false);

  const {
    data: products,
    isLoading,
    isError: productsError,
    refetch: refetchProducts,
  } = useQuery<ProductWithOwnership[]>({
    queryKey: ["/api/products"],
  });

  const { data: userProducts } = useQuery<any[]>({
    queryKey: ["/api/user/products"],
  });

  const {
    data: withdrawalFunds,
    isLoading: withdrawalFundsLoading,
    isError: withdrawalFundsError,
  } = useQuery<{ availableBalance: string }>({
    queryKey: ["/api/withdrawals/available"],
  });

  const purchaseMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await apiRequest("POST", `/api/products/${productId}/purchase`, {});
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Achat impossible");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals/available"] });
      refreshUser();
      setSelectedProduct(null);
      toast({ title: "Produit acheté !", description: "Vous commencerez à recevoir des gains demain." });
    },
  });

  purchasePendingRef.current = purchaseMutation.isPending;

  useEffect(() => {
    if (productLaunchHandledRef.current || !products) return;

    const requestedId = new URLSearchParams(window.location.search).get("product");
    if (!requestedId) return;

    productLaunchHandledRef.current = true;
    const productId = Number(requestedId);
    const requestedProduct = products.find(product => product.id === productId && !product.isFree);

    if (
      requestedProduct?.isActive &&
      !isPurchaseLimitReached(requestedProduct.purchaseLimitPerUser, requestedProduct.purchaseCount ?? 0)
    ) {
      setSelectedProduct(requestedProduct);
    }
    navigate("/products");
  }, [products, navigate]);

  useEffect(() => {
    if (!selectedProduct) return;

    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const dialog = purchaseDialogRef.current;

    document.body.style.overflow = "hidden";
    dialog?.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !purchasePendingRef.current) {
        setSelectedProduct(null);
        return;
      }

      if (event.key !== "Tab") return;
      const focusableElements = dialog?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusableElements?.length) {
        event.preventDefault();
        dialog?.focus();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused?.isConnected) previouslyFocused.focus({ preventScroll: true });
    };
  }, [selectedProduct]);

  if (!user) return null;

  const country = getCountryByCode(user.country);
  const currency = country?.currency || "FCFA";
  const formatAmount = (value: number | null) =>
    value !== null && Number.isFinite(value)
      ? `${currency} ${Math.round(value).toLocaleString("fr-FR")}`
      : "—";
  const availableProducts = products?.filter(product => !product.isFree) || [];
  const activeUserProducts = (userProducts || []).filter(product => product.status === "active");
  const ownedCount = userProducts === undefined ? null : activeUserProducts.length;
  const dailyRevenue = userProducts === undefined
    ? null
    : activeUserProducts.reduce<number | null>((sum, item) => {
        const amount = Number(item.product?.dailyEarnings);
        return sum !== null && Number.isFinite(amount) ? sum + amount : null;
      }, 0);
  const totalBalance = Number(user.balance || 0);
  const availableWithdrawableBalance = withdrawalFunds
    ? Number(withdrawalFunds.availableBalance)
    : null;
  let purchaseFunding = null;
  if (
    selectedProduct &&
    Number.isFinite(totalBalance) &&
    availableWithdrawableBalance !== null &&
    Number.isFinite(availableWithdrawableBalance)
  ) {
    try {
      purchaseFunding = calculateProductPurchaseFunding(
        totalBalance,
        availableWithdrawableBalance,
        Number(selectedProduct.price),
      );
    } catch {
      // Keep the purchase available for server validation, but don't show an invalid split.
    }
  }

  return (
    <main className="cp-products-page">
      <style>{`
        .cp-products-page {
          min-height: 100dvh;
          padding-bottom: calc(78px + env(safe-area-inset-bottom));
          background: transparent;
          color: #111827;
          font-family: Inter, Arial, sans-serif;
        }
        .cp-products-shell { width: 100%; max-width: 512px; margin: 0 auto; background: transparent; }
        .cp-products-stats {
          display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px;
          padding: 16px 18px 14px; background: transparent;
        }
        .cp-products-stat {
          display: flex; min-width: 0; min-height: 82px; align-items: center; gap: 10px;
          padding: 11px; border: 1px solid #e3e9f4; border-radius: 14px;
          background: rgba(255,255,255,.97); color: #111827;
          box-shadow: 0 2px 9px rgba(15,23,42,.09);
        }
        .cp-products-stat-link {
          width: 100%; font: inherit; text-align: left; cursor: pointer;
          transition: transform .16s ease, border-color .16s ease, box-shadow .16s ease;
        }
        .cp-products-stat-link:hover { border-color: #b9c9ee; background: #ffffff; box-shadow: 0 5px 14px rgba(25,71,184,.12); }
        .cp-products-stat-link:active { transform: translateY(1px); }
        .cp-products-stat-link:focus-visible,
        .cp-product-buy:focus-visible,
        .cp-products-retry:focus-visible,
        .cp-products-modal-actions button:focus-visible,
        .cp-products-modal-close:focus-visible {
          outline: 3px solid rgba(25,71,184,.35); outline-offset: 3px;
        }
        .cp-products-stat-icon {
          display: grid; width: 42px; height: 42px; flex: 0 0 42px;
          place-items: center; border: 1px solid #d6e2ff; border-radius: 12px;
          background: #edf2ff; color: #1947b8;
        }
        .cp-products-stat-icon svg { width: 22px; height: 22px; }
        .cp-products-stat-icon--image {
          overflow: hidden; border-color: #d6e2ff; background: #edf2ff;
        }
        .cp-products-stat-icon--image img { display: block; width: 100%; height: 100%; object-fit: contain; }
        .cp-products-stat-copy { flex: 1; min-width: 0; }
        .cp-products-stat-value {
          display: block; overflow: hidden; color: #000; font-size: clamp(15px,4.2vw,18px); font-weight: 800; line-height: 1.1;
          text-overflow: ellipsis; white-space: nowrap;
        }
        .cp-products-stat-label { display: block; margin-top: 5px; color: #625e63; font-size: 12px; line-height: 1.2; }
        .cp-products-stat-chevron { flex: 0 0 auto; color: #1947b8; }
        .cp-products-list { display: grid; gap: 14px; padding: 0 18px; }
        .cp-product-card {
          display: grid; grid-template-columns: clamp(78px, 22vw, 100px) minmax(0, 1fr);
          align-items: stretch; gap: 12px; min-height: 170px; padding: 12px 16px;
          border: 1px solid #e6eaf1; border-radius: 14px; background: #ffffff;
          box-shadow: 0 2px 9px rgba(15,23,42,.10);
          transition: box-shadow .16s ease, transform .16s ease;
        }
        .cp-product-card:hover { transform: translateY(-1px); box-shadow: 0 5px 14px rgba(15,23,42,.13); }
        .cp-product-card.is-unavailable { border-color: #cbd5e1; box-shadow: 0 2px 8px rgba(17,24,39,.08); }
        .cp-product-card.is-unavailable .cp-product-image { opacity: .62; }
        .cp-product-image {
          position: relative; align-self: center; width: 100%; max-width: 100px; aspect-ratio: 1; min-width: 0;
          border-radius: 9px; background: #f1f2f4;
        }
        .cp-product-image-placeholder {
          position: absolute; inset: 0; display: grid; place-items: center;
          border-radius: 9px; background: #f1f2f4; color: #1947b8;
        }
        .cp-product-image img {
          position: absolute; z-index: 1; inset: 0; display: block;
          width: 100%; height: 100%; padding: 6px; border-radius: 9px;
          object-fit: contain; background: #f1f2f4;
        }
        .cp-product-duration {
          position: absolute; z-index: 2; right: -8px; bottom: 3px;
          display: grid; min-width: 54px; min-height: 27px; place-items: center;
          padding: 3px 7px; background: #1947b8; color: #ffffff;
          clip-path: polygon(6% 7%, 17% 13%, 22% 0, 34% 11%, 44% 2%, 53% 12%, 67% 3%, 73% 15%, 91% 10%, 88% 27%, 100% 36%, 91% 49%, 98% 62%, 84% 68%, 88% 87%, 71% 84%, 62% 100%, 50% 88%, 37% 98%, 31% 84%, 13% 90%, 16% 73%, 0 66%, 10% 52%, 1% 38%, 14% 29%);
          font-size: 8px; font-weight: 900; line-height: 1; white-space: nowrap;
          transform: rotate(-9deg);
        }
        .cp-product-info { display: flex; min-width: 0; flex-direction: column; justify-content: space-between; gap: 8px; }
        .cp-product-heading { display: flex; min-width: 0; align-items: flex-start; gap: 5px; }
        .cp-product-heading svg { display: block; width: 18px; height: 18px; flex: 0 0 18px; margin-top: 1px; color: #1947b8; }
        .cp-product-name {
          min-width: 0; margin: 0; color: #111827; font-size: clamp(14px, 4vw, 17px);
          font-weight: 800; line-height: 1.18; overflow-wrap: anywhere;
        }
        .cp-product-metrics {
          display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 8px; align-items: start;
        }
        .cp-product-metric { display: flex; min-width: 0; flex-direction: column; gap: 2px; }
        .cp-product-metric strong {
          overflow: hidden; color: #111827; font-size: clamp(11px, 3.15vw, 14px);
          font-weight: 500; line-height: 1.18; text-overflow: ellipsis; white-space: nowrap;
        }
        .cp-product-metric span { color: #5b606b; font-size: 11px; line-height: 1.2; }
        .cp-product-footer { display: flex; min-width: 0; align-items: center; justify-content: space-between; gap: 7px; }
        .cp-product-price { display: flex; min-width: 0; flex-wrap: wrap; align-items: baseline; gap: 3px 5px; }
        .cp-product-price strong { color: #1947b8; font-size: clamp(14px, 3.8vw, 17px); font-weight: 900; white-space: nowrap; }
        .cp-product-price span { color: #777b84; font-size: 12px; line-height: 1.2; }
        .cp-product-buy {
          display: inline-flex; flex: 0 0 clamp(92px, 24vw, 112px); min-width: 0; min-height: 36px;
          align-items: center; justify-content: center; padding: 7px 8px;
          border: 0; border-radius: 8px; background: linear-gradient(135deg, #12358f 0%, #081d58 100%);
          color: #ffffff; font-size: 15px; font-weight: 800; white-space: nowrap;
          box-shadow: 0 2px 5px rgba(8,29,88,.22);
          transition: transform .16s ease, filter .16s ease;
        }
        .cp-product-buy:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(.96); }
        .cp-product-buy:active:not(:disabled) { transform: translateY(1px); }
        .cp-product-buy.is-unavailable {
          background: #e5e7eb; color: #6b7280; box-shadow: none;
          cursor: not-allowed; white-space: normal; line-height: 1.1;
        }
        .cp-products-empty {
          display: flex; min-height: 260px; flex-direction: column; align-items: center;
          justify-content: center; gap: 10px; border: 1px solid #e3e9f4; border-radius: 16px;
          padding: 20px; background: rgba(255,255,255,.97); color: #5b606b; text-align: center;
          box-shadow: 0 2px 9px rgba(15,23,42,.09);
        }
        .cp-products-empty > svg { color: #1947b8; }
        .cp-products-empty p { max-width: 280px; margin: 0; font-size: 14px; line-height: 1.4; }
        .cp-products-retry {
          min-height: 42px; margin-top: 4px; padding: 9px 16px;
          border: 0; border-radius: 10px; background: linear-gradient(135deg, #1947b8, #12358f);
          color: #fff; font-size: 13px; font-weight: 800; box-shadow: 0 3px 8px rgba(25,71,184,.2);
        }
        .cp-products-modal-backdrop {
          position: fixed; z-index: 60; inset: 0; display: grid; place-items: center;
          overflow-y: auto; overscroll-behavior: contain;
          padding: max(14px, env(safe-area-inset-top)) 14px max(14px, env(safe-area-inset-bottom));
          background: rgba(6,18,55,.70); backdrop-filter: blur(5px);
          animation: cp-modal-fade-in .16s ease-out;
        }
        .cp-products-modal {
          width: 100%; max-width: 420px; max-height: calc(100dvh - 32px); overflow-y: auto;
          overscroll-behavior: contain; scrollbar-gutter: stable;
          padding: 20px; border: 1px solid #dfe6f3; border-radius: 20px;
          background: #ffffff; color: #111827;
          box-shadow: 0 22px 70px rgba(3,12,38,.34);
          animation: cp-modal-rise-in .2s cubic-bezier(.2,.8,.2,1);
          outline: none;
        }
        .cp-products-modal-header {
          display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
        }
        .cp-products-modal-heading { display: flex; min-width: 0; align-items: center; gap: 11px; }
        .cp-products-modal-icon {
          display: grid; width: 42px; height: 42px; flex: 0 0 42px; place-items: center;
          border: 1px solid #d6e2ff; border-radius: 13px; background: #edf2ff; color: #1947b8;
        }
        .cp-products-modal-heading-copy { min-width: 0; }
        .cp-products-modal-eyebrow {
          display: block; margin-bottom: 4px; color: #1947b8; font-size: 10px;
          font-weight: 800; letter-spacing: .09em; line-height: 1.2; text-transform: uppercase;
        }
        .cp-products-modal h2 { margin: 0; color: #0b1f54; font-size: 19px; font-weight: 800; line-height: 1.2; }
        .cp-products-modal-close {
          display: grid; width: 34px; height: 34px; flex: 0 0 34px; place-items: center;
          border: 0; border-radius: 10px; background: #f1f4fa; color: #44536f;
          transition: background-color .15s ease, color .15s ease;
        }
        .cp-products-modal-close:hover:not(:disabled) { background: #e6edfa; color: #12358f; }
        .cp-products-modal-close:disabled { cursor: not-allowed; opacity: .55; }
        .cp-products-modal-product {
          margin: 16px 0 0; padding-bottom: 11px; border-bottom: 1px solid #e9edf4;
          color: #4b5563; font-size: 14px; font-weight: 700; line-height: 1.35; overflow-wrap: anywhere;
        }
        .cp-products-modal-summary {
          display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 12px;
        }
        .cp-products-modal-summary-primary,
        .cp-products-modal-summary-item {
          display: flex; min-width: 0; flex-direction: column; gap: 4px;
          padding: 11px 12px; border: 1px solid #e5eaf3; border-radius: 12px; background: #f8faff;
        }
        .cp-products-modal-summary-primary {
          grid-column: 1 / -1; flex-direction: row; align-items: center;
          justify-content: space-between; gap: 10px; border-color: #d6e2ff;
          background: linear-gradient(110deg, #f0f5ff, #e7eeff);
        }
        .cp-products-modal-summary span { color: #647084; font-size: 11px; line-height: 1.25; }
        .cp-products-modal-summary strong {
          color: #101827; font-size: 14px; font-weight: 800; line-height: 1.2;
          overflow-wrap: anywhere;
        }
        .cp-products-modal-summary-primary strong { color: #12358f; font-size: 18px; text-align: right; }
        .cp-products-modal-description {
          margin: 12px 0 0; color: #5b6474; font-size: 12px; line-height: 1.5;
        }
        .cp-products-modal-wallets {
          display: grid; gap: 8px; margin-top: 14px; padding: 12px;
          border: 1px solid #dbe5ff; border-radius: 14px; background: #f8faff;
        }
        .cp-products-modal-wallets-heading {
          display: flex; align-items: center; gap: 7px; padding-bottom: 8px;
          border-bottom: 1px solid #e3eaf7; color: #12358f; font-size: 12px; font-weight: 800;
        }
        .cp-products-modal-wallet-row {
          display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;
          color: #515d70; font-size: 11px; line-height: 1.4;
        }
        .cp-products-modal-wallet-row strong { flex: 0 0 auto; color: #111827; font-size: 11px; font-weight: 700; white-space: nowrap; }
        .cp-products-modal-wallet-note {
          margin: 2px 0 0 !important; padding: 8px 9px 0; border-top: 1px dashed #cbd8f7;
          color: #12358f !important; font-size: 11px !important; line-height: 1.4 !important;
        }
        .cp-products-modal-status {
          margin: 0 !important; color: #596579 !important; font-size: 11px !important;
          line-height: 1.4 !important;
        }
        .cp-products-modal-warning {
          display: flex; align-items: flex-start; gap: 8px; margin-top: 12px; padding: 9px;
          border: 1px solid #fda4af; border-radius: 10px; background: #fff1f2; color: #9f1239;
          font-size: 11px; line-height: 1.35;
        }
        .cp-products-modal-warning svg,
        .cp-products-modal-error svg { flex: 0 0 auto; margin-top: 1px; }
        .cp-products-modal-error {
          display: flex; align-items: flex-start; gap: 8px; margin-top: 11px; padding: 10px;
          border: 1px solid #fda4af; border-radius: 11px; background: #fff1f2; color: #9f1239;
          font-size: 12px; line-height: 1.4;
        }
        .cp-products-modal-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin-top: 18px; }
        .cp-products-modal-actions button {
          display: inline-flex; min-width: 0; min-height: 44px; align-items: center; justify-content: center;
          gap: 8px; padding: 9px 10px; border: 1px solid #d5deec; border-radius: 11px;
          background: #ffffff; color: #344054; font-size: 13px; font-weight: 800;
          transition: background-color .15s ease, border-color .15s ease, transform .15s ease, opacity .15s ease;
        }
        .cp-products-modal-actions button:first-child:hover:not(:disabled) { border-color: #b9c9ee; background: #f5f8ff; }
        .cp-products-modal-actions button:last-child {
          border-color: #12358f; background: linear-gradient(135deg, #1947b8 0%, #12358f 100%);
          color: #ffffff; box-shadow: 0 4px 10px rgba(18,53,143,.2);
        }
        .cp-products-modal-actions button:last-child:hover:not(:disabled) { transform: translateY(-1px); }
        .cp-products-modal-actions button:disabled { cursor: not-allowed; opacity: .58; box-shadow: none; }
        @keyframes cp-modal-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cp-modal-rise-in { from { opacity: 0; transform: translateY(9px) scale(.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @media (prefers-reduced-motion: reduce) {
          .cp-products-modal-backdrop, .cp-products-modal, .cp-products-modal-actions button { animation: none; transition: none; }
        }
        @media (max-width: 370px) {
          .cp-products-stats { gap: 8px; padding-right: 14px; padding-left: 14px; }
          .cp-products-stat { gap: 8px; padding: 9px; }
          .cp-products-stat-icon { width: 36px; height: 36px; flex-basis: 36px; }
          .cp-products-list { padding-right: 14px; padding-left: 14px; }
          .cp-product-card { grid-template-columns: 70px minmax(0, 1fr); gap: 9px; min-height: 146px; padding: 9px; }
          .cp-product-name { font-size: 14px; }
          .cp-product-metrics { gap: 5px; }
          .cp-product-metric strong { font-size: 10px; }
          .cp-product-metric span { font-size: 9px; }
          .cp-product-buy { flex-basis: 82px; min-height: 34px; padding: 6px 4px; font-size: 12px; }
          .cp-products-modal { padding: 16px; border-radius: 17px; }
          .cp-products-modal h2 { font-size: 17px; }
          .cp-products-modal-summary-primary strong { font-size: 16px; }
          .cp-products-modal-actions button { padding-right: 6px; padding-left: 6px; font-size: 12px; }
        }
      `}</style>

      <div className="cp-products-shell">
        <h1 className="sr-only">Produits Equinor</h1>

        <section className="cp-products-stats" aria-label="Résumé des produits">
          <button
            className="cp-products-stat cp-products-stat-link"
            type="button"
            onClick={() => navigate("/income")}
            aria-label="Voir les produits achetés"
          >
            <span className="cp-products-stat-icon cp-products-stat-icon--image">
              <img src={equipmentIcon} alt="" aria-hidden="true" />
            </span>
            <span className="cp-products-stat-copy">
              <strong className="cp-products-stat-value">{ownedCount ?? "—"}</strong>
              <small className="cp-products-stat-label">Produits achetés</small>
            </span>
            <ChevronRight className="cp-products-stat-chevron" aria-hidden="true" size={18} />
          </button>
          <div className="cp-products-stat">
            <span className="cp-products-stat-icon cp-products-stat-icon--image">
              <img src={revenueIcon} alt="" aria-hidden="true" />
            </span>
            <span className="cp-products-stat-copy">
              <strong className="cp-products-stat-value">{formatAmount(dailyRevenue)}</strong>
              <small className="cp-products-stat-label">Revenu quotidien</small>
            </span>
          </div>
        </section>

        <section className="cp-products-list" aria-label="Produits disponibles">
          {isLoading ? (
            <div className="cp-products-empty" role="status">
              <Loader2 className="animate-spin" aria-hidden="true" size={30} />
              <p>Chargement des produits…</p>
            </div>
          ) : productsError && !products ? (
            <div className="cp-products-empty" role="alert">
              <AlertTriangle aria-hidden="true" size={34} />
              <p>Impossible de charger les produits pour le moment.</p>
              <button className="cp-products-retry" type="button" onClick={() => { void refetchProducts(); }}>
                Réessayer
              </button>
            </div>
          ) : availableProducts.length === 0 ? (
            <div className="cp-products-empty" role="status">
              <ShoppingBag aria-hidden="true" size={38} />
              <p>Aucun produit disponible pour le moment</p>
            </div>
            ) : availableProducts.map(product => {
              const imageUrl = product.imageUrl?.trim();
              const purchaseLimitReached = isPurchaseLimitReached(
                product.purchaseLimitPerUser,
                product.purchaseCount ?? 0,
              );
              return (
                <article className={`cp-product-card${product.isActive ? "" : " is-unavailable"}`} key={product.id} data-testid={`product-card-${product.id}`}>
                  <div className="cp-product-image">
                    <span className="cp-product-image-placeholder"><BatteryCharging aria-hidden="true" size={30} /></span>
                    {imageUrl && (
                      <img
                        src={imageUrl}
                        alt={product.name}
                        loading="lazy"
                        onError={event => { event.currentTarget.style.display = "none"; }}
                      />
                    )}
                    <span className="cp-product-duration">{Number.isFinite(Number(product.cycleDays)) ? `${Number(product.cycleDays)} jours` : "Cycle"}</span>
                  </div>
                  <div className="cp-product-info">
                    <div className="cp-product-heading">
                      <svg aria-hidden="true" viewBox="0 0 24 24">
                        <path d="M12 22s8-7.3 8-13A8 8 0 1 0 4 9c0 5.7 8 13 8 13Z" fill="currentColor" />
                        <circle cx="12" cy="9" r="2.5" fill="#fff" />
                      </svg>
                      <h2 className="cp-product-name">
                        {product.name}
                        {!product.isActive && <span className="ml-2 text-xs font-bold uppercase text-gray-500">Indisponible</span>}
                      </h2>
                    </div>
                    <div className="cp-product-metrics">
                      <div className="cp-product-metric"><strong>{formatAmount(Number(product.totalReturn))}</strong><span>Revenu total</span></div>
                      <div className="cp-product-metric"><strong>{formatAmount(Number(product.dailyEarnings))}</strong><span>Revenu quotidien</span></div>
                    </div>
                    <div className="cp-product-footer">
                      <div className="cp-product-price"><strong>{formatAmount(Number(product.price))}</strong><span>Prix d'achat</span></div>
                      <button
                        className={`cp-product-buy${product.isActive ? "" : " is-unavailable"}`}
                        onClick={() => {
                          if (!product.isActive || purchaseLimitReached) return;
                          purchaseMutation.reset();
                          setSelectedProduct(product);
                        }}
                        disabled={!product.isActive || purchaseLimitReached}
                        aria-label={
                          !product.isActive
                            ? `${product.name} indisponible`
                            : purchaseLimitReached
                              ? `Limite d'achat atteinte pour ${product.name}`
                              : `Investir dans ${product.name}`
                        }
                        data-testid={`button-purchase-${product.id}`}
                      >
                        {!product.isActive ? "Indisponible" : purchaseLimitReached ? "Limite atteinte" : "Investir"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
        </section>
      </div>

      {selectedProduct && (
        <div
          className="cp-products-modal-backdrop"
          onClick={event => {
            if (event.target === event.currentTarget && !purchaseMutation.isPending) {
              setSelectedProduct(null);
            }
          }}
        >
          <div
            ref={purchaseDialogRef}
            className="cp-products-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cp-product-confirm-title cp-product-confirm-product"
            aria-describedby="cp-product-confirm-description"
            tabIndex={-1}
            onClick={event => event.stopPropagation()}
          >
            <div className="cp-products-modal-header">
              <div className="cp-products-modal-heading">
                <span className="cp-products-modal-icon"><ShoppingBag aria-hidden="true" size={21} /></span>
                <div className="cp-products-modal-heading-copy">
                  <span className="cp-products-modal-eyebrow">Confirmation d'achat</span>
                  <h2 id="cp-product-confirm-title">Vérifier votre achat</h2>
                </div>
              </div>
              <button
                className="cp-products-modal-close"
                type="button"
                aria-label="Fermer la confirmation"
                disabled={purchaseMutation.isPending}
                onClick={() => setSelectedProduct(null)}
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>

            <div className="cp-products-modal-product" id="cp-product-confirm-product">{selectedProduct.name}</div>
            <div className="cp-products-modal-summary">
              <div className="cp-products-modal-summary-primary">
                <span>Prix d'achat</span>
                <strong>{formatAmount(Number(selectedProduct.price))}</strong>
              </div>
              <div className="cp-products-modal-summary-item">
                <span>Revenu quotidien</span>
                <strong>{formatAmount(Number(selectedProduct.dailyEarnings))}</strong>
              </div>
              <div className="cp-products-modal-summary-item">
                <span>Revenu total</span>
                <strong>{formatAmount(Number(selectedProduct.totalReturn))}</strong>
              </div>
            </div>
            <p className="cp-products-modal-description" id="cp-product-confirm-description">
              Après l’achat, vos revenus seront crédités quotidiennement pendant{" "}
              {Number.isFinite(Number(selectedProduct.cycleDays)) ? `${Number(selectedProduct.cycleDays)} jours` : "la durée prévue"}.
            </p>

            <section className="cp-products-modal-wallets" aria-label="Répartition des soldes pour l'achat">
              <div className="cp-products-modal-wallets-heading">
                <Wallet aria-hidden="true" size={16} />
                <span>Répartition des soldes</span>
              </div>
              {purchaseFunding ? (
                <>
                  <div className="cp-products-modal-wallet-row">
                    <span>Dépôts (utilisables pour l'achat)</span>
                    <strong>{formatAmount(purchaseFunding.depositBalance)}</strong>
                  </div>
                  <div className="cp-products-modal-wallet-row">
                    <span>Solde retirable</span>
                    <strong>{formatAmount(purchaseFunding.earningsBalance)}</strong>
                  </div>
                  {purchaseFunding.canPurchase && (
                    <p className="cp-products-modal-wallet-note">
                      Pour cet achat : {formatAmount(purchaseFunding.depositUsed)} prélevés sur les dépôts
                      {purchaseFunding.earningsUsed > 0 && `, puis ${formatAmount(purchaseFunding.earningsUsed)} sur les revenus retirables`}.
                    </p>
                  )}
                </>
              ) : withdrawalFundsLoading ? (
                <p className="cp-products-modal-status" role="status">Vérification de la répartition des soldes…</p>
              ) : withdrawalFundsError || !withdrawalFunds ? (
                <p className="cp-products-modal-status" role="status">
                  Répartition temporairement indisponible. Le serveur vérifiera les soldes avant l’achat.
                </p>
              ) : (
                <p className="cp-products-modal-status" role="status">
                  Répartition des soldes indisponible. Le serveur vérifiera les soldes avant l’achat.
                </p>
              )}
            </section>
            {totalBalance < Number(selectedProduct.price) && (
              <div className="cp-products-modal-warning" role="alert">
                <AlertTriangle aria-hidden="true" size={16} />
                <span>Le solde combiné des dépôts et des revenus retirables est insuffisant.</span>
              </div>
            )}
            {purchaseMutation.isError && (
              <div className="cp-products-modal-error" role="alert">
                <AlertTriangle aria-hidden="true" size={17} />
                <span>
                  {purchaseMutation.error instanceof Error
                    ? purchaseMutation.error.message
                    : "L'achat n'a pas abouti. Vérifiez les informations et réessayez."}
                </span>
              </div>
            )}
            <div className="cp-products-modal-actions">
              <button
                type="button"
                disabled={purchaseMutation.isPending}
                onClick={() => setSelectedProduct(null)}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => purchaseMutation.mutate(selectedProduct.id)}
                disabled={purchaseMutation.isPending || totalBalance < Number(selectedProduct.price)}
              >
                {purchaseMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden="true" size={16} />
                    Traitement…
                  </>
                ) : "Confirmer l'achat"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}