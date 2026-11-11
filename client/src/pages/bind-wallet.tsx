import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getCountriesForDisplay, getWithdrawalMethodsForCountry, type ApiCountry } from "@/lib/countries";
import { walletSchema, type WithdrawalWallet } from "@shared/schema";
import AccountDetailHeader from "@/components/account-detail-header";
import "./bind-wallet.css";

type SaveWalletResult = {
  savedExisting: boolean;
  selectedAsDefault: boolean;
};

function maskWalletAccountNumber(value: string): string {
  const compactNumber = value.replace(/\s+/g, "");
  if (compactNumber.length <= 7) return value;
  return `${compactNumber.slice(0, 2)}XXXX${compactNumber.slice(-4)}`;
}

export default function BindWalletPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const returnToWithdrawal = new URLSearchParams(window.location.search).get("from") === "withdrawal";
  const returnDestination = returnToWithdrawal ? "/withdrawal" : "/personal-information";
  const [accountName, setAccountName] = useState(user?.fullName || "");
  const [accountNumber, setAccountNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftMethod, setDraftMethod] = useState("");
  const pickerListRef = useRef<HTMLDivElement>(null);
  const [initializedFromWallet, setInitializedFromWallet] = useState(false);

  const {
    data: wallets,
    isLoading: walletsLoading,
    isError: walletsError,
  } = useQuery<WithdrawalWallet[]>({
    queryKey: ["/api/wallets"],
    enabled: !!user,
  });
  const {
    data: loadedCountries,
    isError: countriesError,
    isLoading: countriesLoading,
  } = useQuery<ApiCountry[]>({
    queryKey: ["/api/countries"],
  });

  const countries = getCountriesForDisplay(loadedCountries, countriesError);
  const methods = useMemo(
    () => user ? getWithdrawalMethodsForCountry(user.country, countries) : [],
    [countries, user?.country],
  );
  const defaultWallet = wallets?.find((wallet) => wallet.isDefault) ?? wallets?.[0];

  useEffect(() => {
    if (!pickerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPickerOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [pickerOpen]);

  useEffect(() => {
    if (!pickerOpen) return;
    const selectedIndex = Math.max(0, methods.indexOf(draftMethod));
    requestAnimationFrame(() => {
      if (pickerListRef.current) pickerListRef.current.scrollTop = selectedIndex * 48;
    });
  }, [draftMethod, methods, pickerOpen]);

  useEffect(() => {
    if (walletsLoading || countriesLoading || initializedFromWallet) return;
    if (
      defaultWallet
      && defaultWallet.country === user?.country
      && methods.includes(defaultWallet.paymentMethod)
    ) {
      setAccountName(defaultWallet.accountName);
      setAccountNumber(defaultWallet.accountNumber);
      setPaymentMethod(defaultWallet.paymentMethod);
    } else if (methods.length > 0) {
      setPaymentMethod(methods[0]);
    }
    setInitializedFromWallet(true);
  }, [countriesLoading, defaultWallet, initializedFromWallet, methods, user?.country, walletsLoading]);

  const saveMutation = useMutation<SaveWalletResult, Error, void>({
    mutationFn: async () => {
      if (!user) throw new Error("Connectez-vous pour lier un portefeuille.");
      const parsed = walletSchema.safeParse({
        accountName,
        accountNumber,
        paymentMethod,
        country: user.country,
      });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message || "Vérifiez les informations du portefeuille.");
      }

      const existing = wallets?.find((wallet) =>
        wallet.accountName.trim().toLowerCase() === parsed.data.accountName.toLowerCase()
        && wallet.accountNumber.trim() === parsed.data.accountNumber
        && wallet.paymentMethod === parsed.data.paymentMethod
        && wallet.country === parsed.data.country,
      );

      if (existing) {
        if (existing.isDefault) return { savedExisting: true, selectedAsDefault: true };
        const response = await apiRequest("PATCH", `/api/wallets/${existing.id}/default`, {});
        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.message || "Le portefeuille n’a pas pu être sélectionné.");
        }
        return { savedExisting: true, selectedAsDefault: true };
      }

      const response = await apiRequest("POST", "/api/wallets", parsed.data);
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Le portefeuille n’a pas pu être enregistré.");
      }
      const createdWallet = await response.json() as WithdrawalWallet;
      const defaultResponse = await apiRequest("PATCH", `/api/wallets/${createdWallet.id}/default`, {});
      return { savedExisting: false, selectedAsDefault: defaultResponse.ok };
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      toast({
        title: result.savedExisting ? "Portefeuille déjà enregistré" : "Portefeuille enregistré",
        description: result.selectedAsDefault
          ? "Ce portefeuille est prêt à recevoir vos retraits."
          : "Il est enregistré, mais n’a pas pu être défini par défaut.",
        variant: result.selectedAsDefault ? "default" : "destructive",
      });
      navigate(returnDestination);
    },
    onError: (error) => {
      toast({
        title: "Enregistrement impossible",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!user) return null;

  return (
    <main className="cp-account-detail cp-bind-wallet-page">
      <AccountDetailHeader
        title="Lier une adresse de portefeuille"
        onBack={() => navigate(returnDestination)}
      />

      <form
        className="cp-bind-wallet-card"
        onSubmit={(event) => {
          event.preventDefault();
          saveMutation.mutate();
        }}
      >
        <section className="cp-wallet-card-preview" aria-label="Aperçu du portefeuille">
          <div className="cp-wallet-card-copy">
            <span className="cp-wallet-card-method">{paymentMethod || "Portefeuille"}</span>
            <span className="cp-wallet-card-number">
              {accountNumber ? maskWalletAccountNumber(accountNumber) : "Numéro du compte"}
            </span>
            <span className="cp-wallet-card-name">Nom réel : {accountName || "—"}</span>
          </div>
          <svg className="cp-wallet-card-chip" viewBox="0 0 64 42" aria-hidden="true">
            <rect x="1" y="1" width="62" height="40" rx="7" fill="#f5c629" stroke="#d9a80e" strokeWidth="2" />
            <path d="M22 2v38M42 2v38M2 14h60M2 28h60M22 14h20M22 28h20" fill="none" stroke="#bd8c06" strokeWidth="1.5" />
          </svg>
        </section>

        <div className="cp-bind-wallet-fields">
          <label className="cp-bind-field">
            <span>Nom du titulaire</span>
            <input
              autoComplete="name"
              value={accountName}
              onChange={(event) => setAccountName(event.target.value)}
              placeholder="Votre nom complet"
              data-testid="input-wallet-name"
            />
          </label>

          <div className="cp-bind-field">
            <span>Portefeuille</span>
            <button
              className="cp-wallet-method-trigger"
              type="button"
              onClick={() => {
                setDraftMethod(paymentMethod || methods[0] || "");
                setPickerOpen(true);
              }}
              disabled={methods.length === 0}
              aria-haspopup="dialog"
              aria-expanded={pickerOpen}
              aria-controls="cp-wallet-method-picker-options"
              data-testid="select-wallet-method"
            >
              <span>{paymentMethod || "Choisir un moyen de retrait"}</span>
              <span className="cp-wallet-method-chevron" aria-hidden="true" />
            </button>
          </div>

          <label className="cp-bind-field">
            <span>Compte du portefeuille</span>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={accountNumber}
              onChange={(event) => setAccountNumber(event.target.value)}
              placeholder="Saisissez le numéro du compte"
              data-testid="input-wallet-account"
            />
          </label>

          {methods.length === 0 && (
            <p className="cp-bind-wallet-error">Aucun moyen de retrait n’est configuré pour votre pays.</p>
          )}
          {walletsError && (
            <p className="cp-bind-wallet-error">
              Impossible de vérifier vos portefeuilles enregistrés. Réessayez avant d’en ajouter un autre.
            </p>
          )}

          <button
            className="cp-bind-wallet-submit"
            type="submit"
            disabled={saveMutation.isPending || walletsLoading || walletsError || methods.length === 0}
            data-testid="button-confirm-wallet"
          >
            {saveMutation.isPending ? "Enregistrement…" : "Confirmer"}
          </button>
        </div>
      </form>

      {pickerOpen && (
        <div
          className="cp-wallet-picker-backdrop"
          onClick={() => setPickerOpen(false)}
          data-testid="wallet-method-picker-backdrop"
        >
          <section
            className="cp-wallet-picker"
            role="dialog"
            aria-modal="true"
            aria-label="Choisir un moyen de retrait"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="cp-wallet-picker-actions">
              <button type="button" onClick={() => setPickerOpen(false)}>
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod(draftMethod);
                  setPickerOpen(false);
                }}
              >
                Terminé
              </button>
            </div>
            <div
              className="cp-wallet-picker-window"
              id="cp-wallet-method-picker-options"
              ref={pickerListRef}
              onScroll={(event) => {
                const nextIndex = Math.round(event.currentTarget.scrollTop / 48);
                const nextMethod = methods[nextIndex];
                if (nextMethod) setDraftMethod(nextMethod);
              }}
              data-testid="wallet-method-picker-options"
            >
              <div className="cp-wallet-picker-options">
                {methods.map((method) => (
                  <button
                    key={method}
                    type="button"
                    className={method === draftMethod ? "is-selected" : ""}
                    aria-pressed={method === draftMethod}
                    onClick={() => {
                      const index = methods.indexOf(method);
                      setDraftMethod(method);
                      pickerListRef.current?.scrollTo({ top: index * 48, behavior: "smooth" });
                    }}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>
            <div className="cp-wallet-picker-selection-mark" aria-hidden="true" />
          </section>
        </div>
      )}
    </main>
  );
}
