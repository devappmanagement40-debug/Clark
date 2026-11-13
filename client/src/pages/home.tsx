import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, FRESH_PLATFORM_SETTINGS_QUERY_OPTIONS, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getCountryByCode } from "@/lib/countries";
import { isPurchaseLimitReached } from "@shared/product-purchase-limit";
import {
  DEFAULT_HOME_WITHDRAWAL_PROCESSING_TEXT,
  DEFAULT_MAX_WITHDRAWALS_PER_DAY,
  DEFAULT_MINIMUM_DEPOSIT,
  DEFAULT_MINIMUM_WITHDRAWAL,
  DEFAULT_WITHDRAWAL_END_HOUR,
  DEFAULT_WITHDRAWAL_FEE_PERCENT,
  DEFAULT_WITHDRAWAL_PREPAYMENT_RATE,
  DEFAULT_WITHDRAWAL_START_HOUR,
  readPositiveIntegerSetting,
  readPercentageSetting,
} from "@shared/platform-settings";
import type { Product } from "@shared/schema";
import { ArrowRight, CreditCard, Headset, Send, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { DuluxProductCard } from "@/components/dulux-product-card";
import "./home.css";

import duluxBanner from "@/assets/images/dulux-signup-hero.png";
import duluxWelcomePopup from "@/assets/images/dulux-welcome-popup.png";
import duluxProduct1 from "@/assets/images/home-products/dulux-product-1.webp";
import duluxProduct2 from "@/assets/images/home-products/dulux-product-2.webp";
import duluxProduct3 from "@/assets/images/home-products/dulux-product-3.webp";

const homeProductImages = [duluxProduct1, duluxProduct2, duluxProduct3] as const;

type HomeCatalogProduct = Product & {
  purchaseCount?: number;
};

export default function HomePage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const {
    data: settings,
    isLoading: settingsLoading,
    isFetching: settingsRefreshing,
  } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
    ...FRESH_PLATFORM_SETTINGS_QUERY_OPTIONS,
  });
  const {
    data: products,
    isLoading: productsLoading,
    isError: productsError,
    refetch: refetchProducts,
  } = useQuery<HomeCatalogProduct[]>({
    queryKey: ["/api/products"],
    enabled: !!user,
  });
  const [welcomePopupOpen, setWelcomePopupOpen] = useState(false);
  const [purchasePromptProduct, setPurchasePromptProduct] = useState<HomeCatalogProduct | null>(null);
  const purchaseMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await apiRequest("POST", `/api/products/${productId}/purchase`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wheel/spins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals/available"] });
      refreshUser();
      setPurchasePromptProduct(null);
      toast({ title: "Produit acheté !", description: "Vous commencerez à recevoir des gains demain." });
    },
    onError: (error) => {
      toast({
        title: "Achat impossible",
        description: error instanceof Error ? error.message : "L'achat n'a pas abouti. Réessayez.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!user || settingsLoading || settingsRefreshing) return;

    const timer = window.setTimeout(() => {
      setWelcomePopupOpen(true);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [user?.id, settingsLoading, settingsRefreshing]);

  if (!user) return null;
  const currency = getCountryByCode(user.country)?.currency || "XOF";
  const balance = Number(user.earningsBalance || 0);
  const depositBalance = Number(user.depositBalance || 0);
  const totalIncome = Number(user.totalEarnings || 0);
  const formatMoney = (amount: number) =>
    Number.isFinite(amount) ? `${Math.round(amount).toLocaleString("fr-FR")} ${currency}` : "—";
  const availableProducts = (products || []).filter((product) => !product.isFree);
  const popupCurrency = currency === "FCFA" ? "XOF" : currency;
  const formatPopupMoney = (amount: number) => `${Math.round(amount).toLocaleString("fr-FR")} ${popupCurrency}`;
  const parseIntegerSetting = (key: string, fallback: number) => {
    const value = Number.parseInt(settings?.[key] || "", 10);
    return Number.isFinite(value) ? value : fallback;
  };
  const parseDecimalSetting = (key: string, fallback: number) => {
    const value = Number.parseFloat(settings?.[key] || "");
    return Number.isFinite(value) ? value : fallback;
  };
  const minimumDeposit = readPositiveIntegerSetting(settings?.minDeposit, DEFAULT_MINIMUM_DEPOSIT);
  const minimumWithdrawal = readPositiveIntegerSetting(settings?.minWithdrawal, DEFAULT_MINIMUM_WITHDRAWAL);
  const withdrawalFee = parseDecimalSetting("withdrawalFees", DEFAULT_WITHDRAWAL_FEE_PERCENT);
  const withdrawalStartHour = parseIntegerSetting("withdrawalStartHour", DEFAULT_WITHDRAWAL_START_HOUR);
  const withdrawalEndHour = parseIntegerSetting("withdrawalEndHour", DEFAULT_WITHDRAWAL_END_HOUR);
  const maxWithdrawalsPerDay = parseIntegerSetting("maxWithdrawalsPerDay", DEFAULT_MAX_WITHDRAWALS_PER_DAY);
  const withdrawalPrepaymentEnabled = settings?.withdrawalPrepaymentEnabled === "true";
  const withdrawalPrepaymentRate = readPercentageSetting(
    settings?.withdrawalPrepaymentRate,
    DEFAULT_WITHDRAWAL_PREPAYMENT_RATE,
    1,
  );
  const popupRows = [
    { label: "Dépôt minimum", value: formatPopupMoney(minimumDeposit) },
    { label: "Retrait minimum", value: formatPopupMoney(minimumWithdrawal) },
    {
      label: "Frais de retrait",
      value: `${withdrawalFee.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`,
    },
    { label: "Horaires de retrait", value: `${withdrawalStartHour} h – ${withdrawalEndHour} h` },
    {
      label: "Limite quotidienne",
      value: `${maxWithdrawalsPerDay} demande${maxWithdrawalsPerDay === 1 ? "" : "s"}`,
    },
    {
      label: "Délai de traitement",
      value: settings?.homeWithdrawalProcessingText
        || DEFAULT_HOME_WITHDRAWAL_PROCESSING_TEXT,
    },
    ...(withdrawalPrepaymentEnabled
      ? [{ label: "Prépaiement", value: `${withdrawalPrepaymentRate} % du montant demandé avant traitement` }]
      : []),
    {
      label: "Avant de valider",
      value: "Vérifiez le portefeuille et le montant net affiché",
    },
  ];
  const groupLink = settings?.groupLink || "";
  const groupEnabled = settings?.groupEnabled !== "false";
  const supportLink = settings?.supportLink || "";
  const supportEnabled = settings?.supportEnabled !== "false";
  const configuredPopupButtonLabel = settings?.popupButtonLabel?.trim() || "";
  const popupButtonLabel =
    configuredPopupButtonLabel.length > 12 ? "Groupe" : configuredPopupButtonLabel || "Groupe";

  return (
    <>
      <main className="cp-home">
        <div className="cp-shell">
          <section className="cp-hero" aria-label="Bannière Dulux">
            <img className="cp-hero-image" src={duluxBanner} alt="Bannière Dulux" fetchPriority="high" />
          </section>

          <section className="cp-summary" aria-label="Résumé du compte">
            <div className="cp-summary-card">
              <button
                className="cp-summary-item cp-summary-link"
                type="button"
                onClick={() => navigate("/wallet?from=home")}
                aria-label={`Voir le portefeuille, solde retirable ${formatMoney(balance)}`}
              >
                <strong data-testid="text-balance">{formatMoney(balance)}</strong>
                <span>Solde</span>
              </button>
              <article className="cp-summary-item">
                <strong data-testid="text-deposit-balance">{formatMoney(depositBalance)}</strong>
                <span>Dépôt</span>
              </article>
              <article className="cp-summary-item">
                <strong data-testid="text-total-earnings">{formatMoney(totalIncome)}</strong>
                <span>Revenus totaux</span>
              </article>
            </div>
          </section>

          <section className="cp-actions" aria-label="Actions rapides">
            <button className="cp-action" type="button" onClick={() => navigate("/deposit")}>
              <span className="cp-action-icon cp-action-deposit" aria-hidden="true">
                <span className="cp-action-money-mark">₱</span>
              </span>
              <span>Dépôt</span>
            </button>
            <button className="cp-action" type="button" onClick={() => navigate("/withdrawal")}>
              <span className="cp-action-icon cp-action-withdrawal" aria-hidden="true">
                <CreditCard size={27} strokeWidth={1.8} />
                <ArrowRight className="cp-action-withdrawal-arrow" size={14} strokeWidth={2.4} />
              </span>
              <span>Retrait</span>
            </button>
            <button
              className="cp-action"
              type="button"
              onClick={() => {
                if (supportEnabled && supportLink) {
                  window.open(supportLink, "_blank", "noopener,noreferrer");
                }
              }}
              disabled={!supportEnabled || !supportLink}
              aria-label={supportEnabled && supportLink ? "Contacter le service client" : "Service client indisponible"}
              data-testid="home-service-link"
            >
              <span className="cp-action-icon cp-action-service" aria-hidden="true">
                <Headset size={27} strokeWidth={1.8} />
              </span>
              <span>Service</span>
            </button>
            <button
              className="cp-action"
              type="button"
              onClick={() => {
                if (groupEnabled && groupLink) {
                  window.open(groupLink, "_blank", "noopener,noreferrer");
                }
              }}
              disabled={!groupEnabled || !groupLink}
              aria-label={groupEnabled && groupLink ? "Ouvrir le groupe" : "Lien du groupe indisponible"}
              data-testid="home-group-link"
            >
              <span className="cp-action-icon cp-action-group" aria-hidden="true"><Send size={27} strokeWidth={1.8} /></span>
              <span>Groupe</span>
            </button>
          </section>

          <section className="cp-products" aria-label="Offres disponibles">
            {productsLoading ? (
              <div className="cp-products-state" role="status">Chargement des offres…</div>
            ) : productsError && !products ? (
              <div className="cp-products-state" role="alert">
                <span>Impossible de charger les offres.</span>
                <button type="button" onClick={() => { void refetchProducts(); }}>Réessayer</button>
              </div>
            ) : availableProducts.length === 0 ? (
              <div className="cp-products-state" role="status">Aucune offre disponible pour le moment.</div>
            ) : (
              availableProducts.map((product, index) => {
                const fallbackImage = homeProductImages[index % homeProductImages.length];
                const purchaseCount = Number(product.purchaseCount || 0);
                const purchaseLimitReached = isPurchaseLimitReached(
                  product.purchaseLimitPerUser,
                  purchaseCount,
                );

                return (
                  <DuluxProductCard
                    key={product.id}
                    product={product}
                    imageFallback={fallbackImage}
                    formatMoney={formatMoney}
                    purchaseCount={purchaseCount}
                    purchaseLimitReached={purchaseLimitReached}
                    buyDisabled={!product.isActive || purchaseLimitReached}
                    buyLabel={!product.isActive ? "Indisponible" : purchaseLimitReached ? "Limite atteinte" : "Acheter maintenant"}
                    buyAriaLabel={
                      !product.isActive
                        ? `${product.name} indisponible`
                        : purchaseLimitReached
                          ? `Limite d'achat atteinte pour ${product.name}`
                          : `Acheter ${product.name}`
                    }
                    onBuy={() => {
                      purchaseMutation.reset();
                      setPurchasePromptProduct(product);
                    }}
                    testId={`home-product-${product.id}`}
                  />
                );
              })
            )}
          </section>
        </div>
      </main>

      <Dialog open={welcomePopupOpen} onOpenChange={setWelcomePopupOpen}>
        <DialogContent className="cp-dialog z-[60]" overlayClassName="cp-dialog-overlay">
          <DialogTitle className="sr-only">Message d’accueil Dulux DT</DialogTitle>
          <button
            className="cp-dialog-x"
            type="button"
            onClick={() => setWelcomePopupOpen(false)}
            aria-label="Fermer le message"
          >
            <X size={23} aria-hidden="true" />
          </button>
          <div className="cp-dialog-copy">
            <img
              className="cp-dialog-company-image"
              src={duluxWelcomePopup}
              alt="Welcome to Dulux"
              loading="lazy"
            />
            <div className="cp-dialog-list" role="list">
              {popupRows.map((row) => (
                <div className="cp-dialog-row" key={row.label} role="listitem">
                  <span className="cp-dialog-row-label">{row.label}</span>
                  <strong className="cp-dialog-row-value">{row.value}</strong>
                </div>
              ))}
            </div>
            <DialogDescription className="cp-dialog-message">
              Bienvenue sur votre espace. Consultez les conditions des dépôts, des retraits et des bonus avant toute opération.
            </DialogDescription>
            {groupEnabled && groupLink ? (
              <a
                className="cp-dialog-telegram"
                href={groupLink}
                target="_blank"
                rel="noreferrer"
                onClick={() => setWelcomePopupOpen(false)}
              >
                <Send size={20} aria-hidden="true" />
                <span>{popupButtonLabel}</span>
              </a>
            ) : (
              <button className="cp-dialog-close" type="button" onClick={() => setWelcomePopupOpen(false)}>
                Fermer
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={purchasePromptProduct !== null}
        onOpenChange={(open) => {
          if (!open && !purchaseMutation.isPending) setPurchasePromptProduct(null);
        }}
      >
        <DialogContent
          className="cp-purchase-prompt z-[60]"
          overlayClassName="cp-purchase-prompt-overlay"
          onEscapeKeyDown={(event) => {
            if (purchaseMutation.isPending) event.preventDefault();
          }}
        >
          <div className="cp-purchase-prompt-copy">
            <DialogTitle className="cp-purchase-prompt-title">Prompt</DialogTitle>
            <DialogDescription className="cp-purchase-prompt-message">
              Are you sure you want to purchase this product?
            </DialogDescription>
          </div>
          <div className="cp-purchase-prompt-actions">
            <button
              type="button"
              disabled={purchaseMutation.isPending}
              onClick={() => setPurchasePromptProduct(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="is-confirm"
              disabled={purchaseMutation.isPending || !purchasePromptProduct}
              onClick={() => {
                if (purchasePromptProduct) purchaseMutation.mutate(purchasePromptProduct.id);
              }}
            >
              {purchaseMutation.isPending ? "Processing..." : "Confirm"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
