import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Copy,
  Info,
  Loader2,
  LockKeyhole,
  Phone,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  UserRound,
  X,
} from "lucide-react";
import type { PaymentNumber } from "@shared/schema";
import duluxLogo from "@/assets/images/dulux-logo.png";
import { buildTogocelManualUssdCode } from "@/lib/manual-ussd";
import { withCoteDIvoireWaveAmount } from "@/lib/wave-payment-link";

type ManualDepositOperator = {
  id?: string;
  name?: string;
  manualNumber?: PaymentNumber;
};

type ManualCountryDepositProps = {
  step: number;
  amount: number;
  currency: string;
  countryCode: string;
  countryName: string;
  phonePrefix: string;
  phoneDigits: number;
  minimumPhoneDigits: number;
  operators: ManualDepositOperator[];
  isLoadingOperators: boolean;
  hasOperatorsError: boolean;
  selectedOperator: ManualDepositOperator | null;
  phone: string;
  onPhoneChange: (value: string) => void;
  onSelectOperator: (operator: ManualDepositOperator) => void;
  onContinue: () => void;
  onBack: () => void;
  onClose: () => void;
  transactionReference: string;
  onTransactionReferenceChange: (value: string) => void;
  onCopyPaymentTarget: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  status: string;
  depositId?: number | null;
  secondsRemaining: number;
  onRefreshStatus: () => void;
  isRefreshing: boolean;
  onViewHistory: () => void;
  onHome: () => void;
};

function operatorLabel(name?: string, countryCode?: string) {
  const normalized = name?.toLocaleLowerCase().replace(/[^a-z0-9]/g, "") || "";
  if (countryCode === "TG" && (normalized.includes("togocel") || normalized.includes("tmoney") || normalized.includes("yastogo"))) return "Yas Togo (Togocel)";
  if (countryCode === "BJ" && normalized.includes("mtn")) return "MTN Mobile Money";
  if (countryCode === "CI" && normalized.includes("wave")) return "Wave";
  if (normalized.includes("moov")) return "Moov Money";
  return name || "Mobile Money";
}

function operatorLogo(name?: string, countryCode?: string) {
  const normalized = name?.toLocaleLowerCase().replace(/[^a-z0-9]/g, "") || "";
  if (countryCode === "BJ" && normalized.includes("mtn")) return "/operators/mtn-benin.jpg";
  if (countryCode === "BJ" && normalized.includes("moov")) return "/operators/moov.jpg";
  if (countryCode === "CI" && normalized.includes("wave")) return "/operators/wave.png";
  if (normalized.includes("tmoney") || normalized.includes("togocel") || normalized.includes("yastogo")) return "/operators/tmoney.png";
  if (normalized.includes("moov")) return "/operators/moov-money-togo.webp";
  return null;
}

function formatTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  return `${String(Math.floor(safeSeconds / 60)).padStart(2, "0")}:${String(safeSeconds % 60).padStart(2, "0")}`;
}

export default function ManualCountryDeposit({
  step,
  amount,
  currency,
  countryCode,
  countryName,
  phonePrefix,
  phoneDigits,
  minimumPhoneDigits,
  operators,
  isLoadingOperators,
  hasOperatorsError,
  selectedOperator,
  phone,
  onPhoneChange,
  onSelectOperator,
  onContinue,
  onBack,
  onClose,
  transactionReference,
  onTransactionReferenceChange,
  onCopyPaymentTarget,
  onSubmit,
  isSubmitting,
  status,
  depositId,
  secondsRemaining,
  onRefreshStatus,
  isRefreshing,
  onViewHistory,
  onHome,
}: ManualCountryDepositProps) {
  const [indicativeSeconds, setIndicativeSeconds] = useState(30 * 60);
  const [ussdCopied, setUssdCopied] = useState(false);
  const [ussdCopyFailed, setUssdCopyFailed] = useState(false);
  const displayAmount = amount.toLocaleString("fr-FR");
  const selectedName = operatorLabel(selectedOperator?.name || selectedOperator?.manualNumber?.operatorName, countryCode);
  const paymentNumber = selectedOperator?.manualNumber;
  const target = paymentNumber?.paymentLink || paymentNumber?.phone || paymentNumber?.qrImageUrl || "";
  const paymentLogo = paymentNumber?.logoUrl || operatorLogo(selectedOperator?.name || paymentNumber?.operatorName, countryCode);
  const selectedOperatorNormalized = (selectedOperator?.name || paymentNumber?.operatorName || "").toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
  const isTogocel = selectedOperatorNormalized.includes("togocel") || selectedOperatorNormalized.includes("tmoney") || selectedOperatorNormalized.includes("yastogo");
  const ussdCode = buildTogocelManualUssdCode({
    countryCode,
    operatorName: selectedOperator?.name || paymentNumber?.operatorName || "",
    amount,
    recipientPhone: paymentNumber?.phone,
    paymentLink: paymentNumber?.paymentLink,
    countryPhonePrefix: phonePrefix,
  });
  const digits = phone.replace(/\D/g, "");
  const canContinue = Boolean(
    !hasOperatorsError
    && selectedOperator?.manualNumber
    && target
    && digits.length >= minimumPhoneDigits
    && digits.length <= phoneDigits,
  );
  const phoneLengthHint = minimumPhoneDigits === phoneDigits
    ? `${phoneDigits} chiffres`
    : `entre ${minimumPhoneDigits} et ${phoneDigits} chiffres`;
  const isApproved = status === "approved";
  const isRejected = status === "rejected";
  const isOrangeTheme = countryCode === "CI";

  useEffect(() => {
    if (step !== 1) return;
    setIndicativeSeconds(30 * 60);
    const interval = window.setInterval(() => {
      setIndicativeSeconds((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [step]);

  const copyUssdCode = async () => {
    setUssdCopyFailed(false);
    try {
      await navigator.clipboard.writeText(ussdCode);
      setUssdCopied(true);
      window.setTimeout(() => setUssdCopied(false), 1600);
    } catch {
      setUssdCopied(false);
      setUssdCopyFailed(true);
    }
  };

  const renderHeader = (showTimer: boolean) => (
    <header className="bg-[#00377d] px-4 pb-5 pt-3 text-white shadow-[0_4px_12px_rgba(0,35,82,0.2)] sm:px-5">
      <div className="relative flex min-h-11 items-center justify-end gap-2 border-b border-white/10 pb-3">
        <div className="absolute left-1/2 top-0 flex h-10 w-[84px] -translate-x-1/2 items-center justify-center rounded-md bg-white px-2 shadow-sm">
          <img src={duluxLogo} alt="Dulux" className="h-7 w-full object-contain" />
        </div>
        {showTimer && (
          <div className="rounded-md bg-white px-2 py-1 text-center text-[#00377d] shadow-sm" aria-label={`Compte à rebours indicatif ${formatTime(indicativeSeconds)}`}>
            <span className="block font-mono text-sm font-bold tabular-nums">{formatTime(indicativeSeconds)}</span>
          </div>
        )}
        <button type="button" onClick={onClose} aria-label="Fermer le dépôt" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/40 bg-[#082b54] text-white hover:bg-[#001f47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd100]">
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <div className="pt-4 text-center">
        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#ffd100]">Montant à payer</p>
        <p className="mt-1 text-4xl font-extrabold leading-none tracking-tight text-[#ffd100]">
          <span className="mr-1 text-xl font-bold">{currency}</span>{displayAmount}
        </p>
      </div>
    </header>
  );

  return (
    <main className={`min-h-[100dvh] bg-[#f5f5f5] text-[#263342] ${isOrangeTheme ? "manual-country-deposit--orange" : ""}`}>
      {isOrangeTheme && (
        <style>{`
          .manual-country-deposit--orange [class~="bg-[#00377d]"] { background-color: #f97316 !important; }
          .manual-country-deposit--orange [class~="hover:bg-[#002f6d]"]:hover { background-color: #ea580c !important; }
          .manual-country-deposit--orange [class~="bg-[#082b54]"] { background-color: #c2410c !important; }
          .manual-country-deposit--orange [class~="hover:bg-[#001f47]"]:hover { background-color: #9a3412 !important; }
          .manual-country-deposit--orange [class~="border-[#00377d]"],
          .manual-country-deposit--orange [class~="focus:border-[#00377d]"] { border-color: #f97316 !important; }
          .manual-country-deposit--orange [class~="hover:border-[#00377d]/60"]:hover { border-color: #fb923c !important; }
          .manual-country-deposit--orange [class*="ring-[#00377d]"] { --tw-ring-color: rgb(249 115 22 / 22%) !important; }
          .manual-country-deposit--orange [class~="text-[#00377d]"],
          .manual-country-deposit--orange [class~="text-[#17345b]"] { color: #9a3412 !important; }
          .manual-country-deposit--orange [class~="text-[#ffd100]"] { color: #fff !important; }
          .manual-country-deposit--orange [class~="bg-[#e9f0f8]"] { background-color: #fff7ed !important; }
          .manual-country-deposit--orange [class~="bg-[#7a96b9]"] { background-color: #fdba74 !important; }
          .manual-country-deposit--orange [class~="bg-[#fff7cf]"] { background-color: #fff7ed !important; }
          .manual-country-deposit--orange [class~="border-[#f0dfa0]"],
          .manual-country-deposit--orange [class~="border-[#e3c76b]"] { border-color: #fed7aa !important; }
        `}</style>
      )}
      <div className="mx-auto min-h-[100dvh] w-full max-w-[520px] bg-[#f5f5f5]">
        {renderHeader(step === 1)}

        {step === 0 && (
          <section className="space-y-5 px-4 py-5 sm:px-5">
            <div>
              <h1 className="text-base font-extrabold text-[#24364c]">Sélectionnez votre opérateur</h1>
              <p className="mt-1 text-sm leading-5 text-[#667085]">Choisissez le compte Mobile Money que vous utiliserez pour effectuer le dépôt.</p>
            </div>

            {isLoadingOperators ? (
              <div role="status" className="flex min-h-24 items-center justify-center text-[#00377d]">
                <Loader2 className="h-6 w-6 animate-spin" aria-label="Chargement des opérateurs" />
              </div>
            ) : operators.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {operators.map((option, index) => {
                  const name = option.name || option.manualNumber?.operatorName || "Mobile Money";
                  const isSelected = selectedOperator?.id === option.id && selectedOperator?.name === option.name;
                  const logo = option.manualNumber?.logoUrl || operatorLogo(name, countryCode);
                  return (
                    <button
                      key={`${option.id || name}-${index}`}
                      type="button"
                      onClick={() => onSelectOperator(option)}
                      aria-pressed={isSelected}
                      className={`flex min-h-[76px] items-center gap-3 rounded-xl border-2 bg-white px-3 py-3 text-left shadow-[0_3px_8px_rgba(15,35,60,0.08)] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#00377d]/15 ${
                        isSelected ? "border-[#00377d] ring-2 ring-[#00377d]/15" : "border-[#d7dce3] hover:border-[#00377d]/60"
                      }`}
                    >
                      {logo ? (
                        <img src={logo} alt="" aria-hidden="true" className="h-11 w-11 shrink-0 rounded-lg border border-[#e4e7ec] bg-white object-contain p-1" />
                      ) : (
                        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${isSelected ? "bg-[#00377d] text-white" : "bg-[#eef2f6] text-[#00377d]"}`}>
                          <Smartphone className="h-5 w-5" aria-hidden="true" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-extrabold text-[#17345b]">{operatorLabel(name, countryCode)}</span>
                        {option.manualNumber?.ownerName ? (
                          <span className="mt-0.5 block truncate text-xs text-[#667085]">{option.manualNumber.ownerName}</span>
                        ) : !option.manualNumber ? (
                          <span className="mt-0.5 block truncate text-xs font-semibold text-[#a33d37]">Compte de réception à configurer</span>
                        ) : null}
                      </span>
                      {isSelected && <CheckCircle2 className="h-5 w-5 shrink-0 text-[#00377d]" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div role="status" className="rounded-xl border border-[#e3c76b] bg-[#fff7cf] p-3 text-sm leading-5 text-[#695b20]">
                {hasOperatorsError
                  ? `Impossible de charger les comptes de dépôt du ${countryName}. Réessayez dans quelques instants.`
                  : `Aucun compte ${operators.map((item) => operatorLabel(item.name, countryCode)).join(" ou ")} n’est configuré pour le dépôt au ${countryName}. Ajoutez d’abord les coordonnées de réception dans l’administration.`}
              </div>
            )}

            {hasOperatorsError && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                Les comptes configurés n’ont pas pu être vérifiés. Réessayez avant de poursuivre.
              </p>
            )}

            {selectedOperator && !selectedOperator.manualNumber && !hasOperatorsError && (
              <p role="alert" className="rounded-lg border border-[#e3c76b] bg-[#fff7cf] px-3 py-2 text-sm text-[#695b20]">
                Les coordonnées de réception de cet opérateur doivent d’abord être ajoutées dans l’administration.
              </p>
            )}

            {selectedOperator?.manualNumber && !target && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                Aucun numéro, lien ou QR de réception n’est configuré pour cet opérateur.
              </p>
            )}

            <div className="space-y-1.5">
              <label htmlFor="manual-payer-phone" className="block text-sm font-bold text-[#4c5563]">
                Votre numéro {selectedOperator ? `· ${selectedName}` : "Mobile Money"} <span className="text-[#00377d]">*</span>
              </label>
              <div className="flex min-h-[54px] overflow-hidden rounded-xl border-2 border-[#00377d] bg-white shadow-[0_3px_8px_rgba(0,35,82,0.1)] focus-within:ring-2 focus-within:ring-[#00377d]/15">
                <span className="flex min-w-[72px] items-center justify-center bg-[#00377d] px-3 text-base font-extrabold text-white">+{phonePrefix}</span>
                <input
                  id="manual-payer-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  required
                  maxLength={phoneDigits}
                  value={phone}
                  onChange={(event) => onPhoneChange(event.target.value.replace(/\D/g, "").slice(0, phoneDigits))}
                  placeholder={`Entrez ${phoneLengthHint}`}
                  className="min-w-0 flex-1 px-3 text-base text-[#25364b] outline-none placeholder:text-sm placeholder:text-[#98a2b3]"
                />
              </div>
            </div>

            <div className="flex gap-2 rounded-lg border border-[#f0dfa0] bg-[#fff7cf] px-3 py-3 text-xs leading-5 text-[#695b20]">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#8a7418]" aria-hidden="true" />
              <p>Saisissez votre numéro Mobile Money ({phoneLengthHint}) avec lequel vous effectuerez le dépôt.</p>
            </div>

            <button
              type="button"
              onClick={onContinue}
              disabled={!canContinue}
              className={`min-h-[56px] w-full rounded-xl px-4 text-base font-extrabold text-white shadow-[0_3px_8px_rgba(0,35,82,0.18)] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#00377d]/20 disabled:cursor-not-allowed ${
                canContinue ? "bg-[#00377d] hover:bg-[#002f6d]" : "bg-[#7a96b9]"
              }`}
            >
              Suivant
            </button>

            <div className="flex min-h-[50px] items-center justify-center gap-2 rounded-xl border border-[#d4eee1] bg-[#edfff6] px-3 text-sm font-bold text-[#3d8067]">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              Chiffré et sécurisé
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-4 px-4 py-5 sm:px-5">
            <h1 className="flex items-center gap-2 text-base font-extrabold text-[#263342]">
              <Smartphone className="h-5 w-5 text-[#00377d]" aria-hidden="true" />
              Instructions de paiement
            </h1>

            <div className="flex flex-wrap items-center gap-2 px-1">
              <p className="text-sm font-semibold text-[#5e6673]">
                Destinataire : <strong className="text-[#17345b]">{selectedName}</strong>
              </p>
              <span className="inline-flex rounded-full bg-[#e9f0f8] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#17345b]">
                {isTogocel ? "Carte marchand" : "Compte marchand"}
              </span>
            </div>

            {target ? (
              <>
                {(paymentNumber?.paymentLink || paymentNumber?.phone) && (
                <div>
                  <div className="overflow-hidden rounded-xl border-2 border-[#d7dce3] bg-white shadow-[0_3px_10px_rgba(15,35,60,0.1)]">
                    <div className="flex min-h-[58px] items-center">
                      {paymentLogo && !paymentNumber?.paymentLink && (
                        <img src={paymentLogo} alt="" aria-hidden="true" className="ml-2 h-8 w-8 shrink-0 rounded-md object-contain" />
                      )}
                      <div className="min-w-0 flex-1 px-3">
                        <p className="text-[11px] font-bold text-[#758092]">{paymentNumber?.paymentLink ? "Lien de paiement" : "Numéro du compte"}</p>
                        {paymentNumber?.paymentLink ? (
                          <a
                            href={withCoteDIvoireWaveAmount(paymentNumber.paymentLink, amount, countryCode) || paymentNumber.paymentLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block truncate text-sm font-extrabold text-[#17345b] underline"
                          >
                            Ouvrir le lien de paiement
                          </a>
                        ) : (
                          <p className="break-all font-mono text-lg font-extrabold text-[#17345b]">{paymentNumber?.phone}</p>
                        )}
                      </div>
                      <button type="button" onClick={onCopyPaymentTarget} className="flex min-h-[58px] shrink-0 items-center justify-center gap-1.5 bg-[#00377d] px-3 text-sm font-extrabold text-[#ffd100] hover:bg-[#002f6d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd100]">
                        <Copy className="h-4 w-4" aria-hidden="true" />
                        Copier
                      </button>
                    </div>
                  </div>
                </div>
                )}
                {paymentNumber?.paymentLink && paymentNumber.phone && (
                  <div className="mt-2 rounded-xl border border-[#d7dce3] bg-white px-3 py-2">
                    <p className="text-[11px] font-bold text-[#758092]">Numéro de réception</p>
                    <p className="break-all font-mono text-sm font-extrabold text-[#17345b]">{paymentNumber.phone}</p>
                  </div>
                )}
                {paymentNumber?.qrImageUrl && (
                  <div className="mt-3 rounded-xl border-2 border-[#d7dce3] bg-white p-3 text-center shadow-[0_3px_10px_rgba(15,35,60,0.1)]">
                    <p className="mb-2 text-sm font-bold text-[#5e6673]">Code QR configuré par l’administration</p>
                    <img
                      src={paymentNumber.qrImageUrl}
                      alt={`Code QR de paiement ${selectedName}`}
                      className="mx-auto h-52 w-52 max-w-full rounded-lg object-contain"
                    />
                  </div>
                )}
                {ussdCode && (
                  <div className="mt-3">
                    <p className="mb-1.5 text-sm font-bold text-[#5e6673]">Code USSD rapide</p>
                    <div className="overflow-hidden rounded-xl border-2 border-[#d7dce3] bg-white shadow-[0_3px_10px_rgba(15,35,60,0.1)]">
                      <div className="flex min-h-[58px] items-center">
                        <p className="min-w-0 flex-1 break-all px-3 font-mono text-base font-extrabold text-[#17345b]">{ussdCode}</p>
                        <button type="button" onClick={copyUssdCode} className="flex min-h-[58px] shrink-0 items-center justify-center gap-1.5 bg-[#00377d] px-3 text-sm font-extrabold text-[#ffd100] hover:bg-[#002f6d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd100]">
                          <Copy className="h-4 w-4" aria-hidden="true" />
                          {ussdCopied ? "Copié" : ussdCopyFailed ? "Erreur" : "Copier"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                Les coordonnées de réception ne sont pas configurées pour cet opérateur.
              </div>
            )}

            {paymentNumber?.ownerName && (
              <div>
                <p className="mb-1.5 text-sm font-bold text-[#5e6673]">Titulaire {isTogocel ? "de la carte" : "du compte"}</p>
                <div className="flex min-h-[50px] items-center gap-2 rounded-xl border-2 border-[#d7dce3] bg-white px-3 shadow-[0_3px_10px_rgba(15,35,60,0.1)]">
                  <UserRound className="h-5 w-5 shrink-0 text-[#17345b]" aria-hidden="true" />
                  <p className="font-extrabold text-[#17345b]">{paymentNumber.ownerName}</p>
                </div>
              </div>
            )}

            <div>
              <h2 className="flex items-center gap-2 text-sm font-extrabold text-[#17212e]">
                <Phone className="h-5 w-5 text-[#17345b]" aria-hidden="true" />
                Vérifiez votre numéro
              </h2>
              <p className="mt-2 text-sm font-semibold text-[#68707a]">Si incorrect, modifiez-le.</p>
              <div className="mt-1.5 flex min-h-[48px] items-center overflow-hidden rounded-xl border-2 border-[#d7dce3] bg-white shadow-[0_3px_10px_rgba(15,35,60,0.1)]">
                <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
                  <Phone className="h-5 w-5 shrink-0 text-[#17345b]" aria-hidden="true" />
                  <p className="truncate font-extrabold text-[#17345b]">{phone}</p>
                </div>
                <button type="button" onClick={onBack} className="min-h-[48px] shrink-0 bg-[#00377d] px-3 text-sm font-extrabold text-[#ffd100] hover:bg-[#002f6d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ffd100]">
                  Éditer
                </button>
              </div>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                onSubmit();
              }}
              className="space-y-4"
            >
              <div className="rounded-xl border-2 border-[#d7dce3] bg-white p-3 shadow-[0_3px_10px_rgba(15,35,60,0.1)]">
                <label htmlFor="manual-transaction-id" className="mb-2 block text-sm font-extrabold text-[#17212e]">
                  ID de transaction <span className="text-red-600">*</span>
                </label>
                <input
                  id="manual-transaction-id"
                  type="text"
                  required
                  minLength={1}
                  maxLength={120}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={transactionReference}
                  onChange={(event) => onTransactionReferenceChange(event.target.value)}
                  placeholder="Saisissez l’ID du reçu"
                  className="min-h-[50px] w-full rounded-xl border-2 border-[#d7dce3] bg-white px-3 text-base text-[#17345b] outline-none focus:border-[#00377d] focus:ring-2 focus:ring-[#00377d]/15"
                />
                <p className="mt-1.5 text-xs leading-5 text-[#68707a]">Saisissez l’identifiant reçu après le transfert.</p>
                </div>
              <button
                type="submit"
                disabled={isSubmitting || !target || !phone || !transactionReference.trim()}
                className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-[#00377d] px-4 text-base font-extrabold text-white shadow-[0_3px_8px_rgba(0,35,82,0.18)] transition hover:bg-[#002f6d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#00377d]/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" aria-label="Envoi en cours" /> : "J’ai terminé le paiement"}
              </button>
              <p className="flex gap-2 text-xs leading-5 text-[#667085]">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[#3d8067]" aria-hidden="true" />
                Votre dépôt restera en attente jusqu’à sa vérification.
              </p>
            </form>
          </section>
        )}

        {step >= 3 && (
          <section className="space-y-4 px-4 py-6 sm:px-5">
            <div className="text-center">
              <span className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${isApproved ? "bg-[#edfff6] text-[#3d8067]" : isRejected ? "bg-red-50 text-red-600" : "bg-[#e9f0f8] text-[#00377d]"}`}>
                {isApproved ? <CheckCircle2 className="h-10 w-10" aria-hidden="true" /> : isRejected ? <Info className="h-10 w-10" aria-hidden="true" /> : <Clock3 className="h-10 w-10" aria-hidden="true" />}
              </span>
              <h1 className="mt-3 text-xl font-extrabold text-[#17345b]">
                {isApproved ? "Dépôt confirmé" : isRejected ? "Dépôt refusé" : "Dépôt en attente"}
              </h1>
              <p className="mt-1 text-sm leading-5 text-[#667085]">
                {isApproved
                  ? "Votre dépôt a été validé."
                  : isRejected
                    ? "Le dépôt n’a pas été validé. Consultez l’historique ou contactez le service client."
                    : "Votre demande a été transmise et reste en attente de vérification."}
              </p>
            </div>

            {!isApproved && !isRejected && (
              <div className="rounded-xl border border-[#d7dce3] bg-white p-4 text-center shadow-sm">
                <p className="text-xs font-bold uppercase text-[#667085]">Suivi indicatif</p>
                <p className="mt-1 font-mono text-4xl font-bold tabular-nums text-[#00377d]">{formatTime(secondsRemaining)}</p>
                <p className="mt-2 text-xs leading-5 text-[#667085]">La demande reste en attente après ce délai.</p>
                <button type="button" onClick={onRefreshStatus} disabled={!depositId || isRefreshing} className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#00377d] px-4 text-sm font-bold text-white hover:bg-[#002f6d] disabled:opacity-50">
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden="true" />
                  Vérifier le statut
                </button>
              </div>
            )}

            <div className="space-y-2 rounded-xl border border-[#e0e3e8] bg-white p-4 text-sm shadow-sm">
              <div className="flex justify-between gap-3"><strong>Opérateur</strong><span className="text-right">{selectedName}</span></div>
              <div className="flex justify-between gap-3"><strong>Montant</strong><span className="text-right">{displayAmount} {currency}</span></div>
              <div className="border-t border-[#eef0f2] pt-2"><strong>ID de transaction</strong><p className="mt-1 break-all font-mono">{transactionReference.trim()}</p></div>
              {depositId && <div className="border-t border-[#eef0f2] pt-2"><strong>Référence de dépôt</strong><p className="mt-1 font-mono">#{depositId}</p></div>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={onViewHistory} className="min-h-12 rounded-lg border border-[#00377d] bg-white px-3 text-sm font-bold text-[#00377d] hover:bg-[#eef4fb]">Mes dépôts</button>
              <button type="button" onClick={onHome} className="min-h-12 rounded-lg bg-[#00377d] px-3 text-sm font-bold text-white hover:bg-[#002f6d]">Accueil</button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
