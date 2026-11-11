import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronRight, Clock3, Copy, ExternalLink, Info, Loader2, Phone, RefreshCw, ShieldCheck, X } from "lucide-react";
import { apiRequest, withProcessingIndicator } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { getCountriesForDisplay, parseOperators, type ApiCountry } from "@/lib/countries";
import { sanitizeDepositDisplayText } from "@/lib/deposit-display";
import { withCoteDIvoireWaveAmount } from "@/lib/wave-payment-link";
import type { PaymentNumber } from "@shared/schema";
import HostedPaymentCheckout from "@/components/hosted-payment-checkout";
import ManualCountryDeposit from "@/components/manual-country-deposit";
import duluxLogo from "@/assets/images/dulux-logo.png";

type Provider = "ashtech" | "sendavapay" | "soleaspay" | "clapay";
type Operator = { id?: string; name?: string; operator?: string; slug?: string; code?: string; requiresOtp?: boolean; status?: string; provider?: Provider; manualNumber?: PaymentNumber };
type ProviderInfo = { provider: Provider; name: string; providers?: Array<{ provider: Provider; name: string }> };
type SoleaspayServiceResponse = {
  enabled: boolean;
  enabledCountries: string[];
  services: Record<string, Record<string, unknown>>;
};

const SOLEASPAY_PENDING_DEPOSIT_KEY = "soleaspay-pending-deposit";

function formatTimeRemaining(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function clapayOperatorLogo(country: string, operatorName?: string) {
  const normalized = (operatorName || "").toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
  if (country === "BF") {
    if (normalized.includes("orange")) return "/operators/orange.png";
    if (normalized.includes("moov")) return "/operators/moov.jpg";
  }
  if (country === "NE") {
    if (normalized.includes("airtel")) return "/operators/airtel.png";
    if (normalized.includes("moov")) return "/operators/moov.jpg";
    if (normalized.includes("orange")) return "/operators/orange.png";
    if (normalized.includes("mtn")) return "/operators/mtn.png";
  }
  if (country === "TG" && (normalized.includes("tmoney") || normalized.includes("togocel") || normalized.includes("yastogo"))) {
    return "/operators/tmoney.png";
  }
  return null;
}

function Stepper({
  step,
  labels = ["Numéro de téléphone", "Informations de confirmation", "Paiement terminé"],
  accentColor = "#D40030",
}: {
  step: number;
  labels?: [string, string, string];
  accentColor?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-7">
      {labels.map((label, i) => (
        <div key={label} className="flex items-center flex-1 last:flex-none">
          <div className={`flex flex-col items-center text-center ${i <= step ? "text-[#111827]" : "text-gray-400"}`}>
            <div
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold ${i <= step ? "text-white shadow-[0_2px_0_#111827]" : "border-gray-300 bg-white"}`}
              style={i <= step ? { borderColor: accentColor, backgroundColor: accentColor } : undefined}
            >
              {i < step ? <Check className="w-5 h-5" /> : i + 1}
            </div>
            <span className="text-[11px] leading-tight mt-1 w-24">{label}</span>
          </div>
          {i < 2 && <div className={`h-px flex-1 mx-1 mt-[-18px] ${i < step ? "" : "bg-gray-300"}`} style={i < step ? { backgroundColor: accentColor } : undefined} />}
        </div>
      ))}
    </div>
  );
}

function getHostedManualPaymentMethod(country: string, operatorName: string): "wave" | "card" | null {
  const normalizedName = operatorName.toLowerCase();
  if (country === "CI" && normalizedName.includes("wave")) return "wave";
  if (/\b(carte|card|visa|mastercard)\b/.test(normalizedName)) return "card";
  return null;
}

function canonicalManualOperatorName(country: string, name: string): string {
  const normalized = name.toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
  if (country === "TG") {
    if (normalized.includes("tmoney") || normalized.includes("togocel") || normalized.includes("yastogo")) return "Togocel";
    if (normalized.includes("moov")) return "Moov Africa Togo";
  }
  if (country === "BJ") {
    if (normalized.includes("mtn")) return "MTN Bénin";
    if (normalized.includes("moov")) return "Moov Africa Bénin";
  }
  return name.trim();
}

export default function RobotPayPage() {
  const [, navigate] = useLocation();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const phonePrefilled = useRef(false);
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const amount = Number(params.get("amount") || 0);
  const country = (params.get("country") || "").toUpperCase();
  const returnOperatorName = params.get("operator")?.trim() || "";
  const requestedProvider = (params.get("provider") || "").toLowerCase();
  const isSoleaspayFlow = requestedProvider === "soleaspay";
  const isManualFlow = requestedProvider === "manual";
  const isCiManualFlow = isManualFlow && country === "CI";
  const isTgManualFlow = isManualFlow && country === "TG";
  const isBjManualFlow = isManualFlow && country === "BJ";
  const isCountrySpecificManualFlow = isTgManualFlow || isBjManualFlow || isCiManualFlow;
  const forcedProvider = requestedProvider === "ashtech" || requestedProvider === "sendavapay" || requestedProvider === "clapay"
    ? requestedProvider
    : "";
  const isClapayStyledFlow = forcedProvider === "clapay" && (country === "BF" || country === "NE" || country === "TG");
  // Legacy name for shared CATL styling branches.
  const isBjClapayFlow = isClapayStyledFlow;
  const feePaymentId = Number(params.get("feePaymentId") || 0) || undefined;
  const withdrawalAmount = Number(params.get("withdrawalAmount") || 0) || undefined;
  const parsedClapayReturnDepositId = forcedProvider === "clapay"
    ? Number(params.get("clapayDepositId") || 0)
    : 0;
  const clapayReturnDepositId = Number.isSafeInteger(parsedClapayReturnDepositId) && parsedClapayReturnDepositId > 0
    ? parsedClapayReturnDepositId
    : null;
  const isWithdrawalFeePayment = Boolean(feePaymentId);
  // 0 = operator, 1 = phone, 2 = confirmation, 3 = success
  const [step, setStep] = useState(clapayReturnDepositId ? 2 : 0);
  const [phone, setPhone] = useState("");
  const [clapayOperatorOtp, setClapayOperatorOtp] = useState("");
  const [operator, setOperator] = useState<Operator | null>(() =>
    clapayReturnDepositId && returnOperatorName
      ? { name: returnOperatorName, provider: "clapay" }
      : null,
  );
  const isClapayPhoneValid = !isClapayStyledFlow || phone.replace(/\D/g, "").length === 8;
  const canContinueFromOperatorSelection = Boolean(operator && phone.trim() && isClapayPhoneValid);
  const [depositId, setDepositId] = useState<number | null>(clapayReturnDepositId);
  const [transactionReference] = useState(() => `dépôt-${Math.floor(10000 + Math.random() * 90000)}`);
  const [paymentToken, setPaymentToken] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [otp, setOtp] = useState("");
  const [ashtechOtp, setAshtechOtp] = useState("");
  const [ashtechOtpRequired, setAshtechOtpRequired] = useState(false);
  const [ussd, setUssd] = useState("");
  const [message, setMessage] = useState(
    clapayReturnDepositId ? "Retour reçu. Vérification du dépôt CATL…" : "",
  );
  const [clapayConfirmationCode, setClapayConfirmationCode] = useState("");
  const [nitaCodeMessage, setNitaCodeMessage] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [status, setStatus] = useState(clapayReturnDepositId ? "processing" : "pending");
  const [manualTransactionReference, setManualTransactionReference] = useState("");
  const [manualSubmitted, setManualSubmitted] = useState(false);
  const [manualStatusRefreshing, setManualStatusRefreshing] = useState(false);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [manualVerificationDeadline, setManualVerificationDeadline] = useState<number | null>(null);
  const checkoutDeadline = useRef(Date.now() + 15 * 60 * 1000);
  const checkoutSecondsLeft = Math.max(0, Math.ceil((checkoutDeadline.current - clockNow) / 1000));
  const manualVerificationSecondsLeft = manualVerificationDeadline
    ? Math.max(0, Math.ceil((manualVerificationDeadline - clockNow) / 1000))
    : 0;
  const manualStepperStep = manualSubmitted
    ? status === "approved" ? 3 : 2
    : Math.min(step, 2);

  const { data: loadedCountries, isError: countriesError } = useQuery<ApiCountry[]>({ queryKey: ["/api/countries"] });
  const countries = getCountriesForDisplay(loadedCountries, countriesError);
  const { data: providerInfo, isLoading: providerLoading, error: providerError } = useQuery<ProviderInfo>({
    queryKey: ["/api/deposit/provider", country, forcedProvider],
    queryFn: async () => {
      const providerQuery = forcedProvider ? `?provider=${encodeURIComponent(forcedProvider)}` : "";
      const res = await fetch(`/api/deposit/provider/${country}${providerQuery}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(sanitizeDepositDisplayText(data.message, "Aucun canal automatique disponible"));
      return data;
    },
    enabled: !!country && !isSoleaspayFlow && !isManualFlow,
  });
  const provider: Provider = isSoleaspayFlow
    ? "soleaspay"
    : forcedProvider || providerInfo?.provider || "sendavapay";
  const activeProvider = operator?.provider || provider;
  const isNitaClapayFlow = country === "NE"
    && activeProvider === "clapay"
    && Boolean(operator?.name?.toLowerCase().includes("nita"));
  const hostedManualMethod = isManualFlow && operator?.manualNumber
    ? getHostedManualPaymentMethod(country, operator.name || operator.manualNumber.operatorName)
    : null;
  const availableProviders = isSoleaspayFlow
    ? [{ provider: "soleaspay" as const, name: "SoleaPay" }]
    : providerInfo?.providers || (providerInfo ? [{ provider: providerInfo.provider, name: providerInfo.name }] : []);
  const countryInfo = countries.find(c => c.code === country && c.isActive);
  const currency = countryInfo?.currency || "FCFA";
  const phonePrefix = countryInfo && "phonePrefix" in countryInfo ? countryInfo.phonePrefix : "";
  const paymentPhone = phone.trim().startsWith("+")
    ? phone.trim()
    : phonePrefix
      ? `+${phonePrefix}${phone.replace(/\D/g, "")}`
      : phone.trim();

  const { data: manualNumbers = [], isLoading: manualNumbersLoading, isError: manualNumbersError } = useQuery<PaymentNumber[]>({
    queryKey: ["/api/payment-numbers", country],
    queryFn: async () => {
      const res = await fetch(`/api/payment-numbers?country=${encodeURIComponent(country)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Impossible de charger les numéros de paiement");
      return res.json();
    },
    enabled: !!country && !isSoleaspayFlow && (!forcedProvider || isManualFlow),
  });

  const { data: soleaspayServiceData, isLoading: soleaspayServicesLoading } = useQuery<SoleaspayServiceResponse>({
    queryKey: ["/api/soleaspay/services", country],
    queryFn: async () => {
      const res = await fetch("/api/soleaspay/services", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(sanitizeDepositDisplayText(data.message, "Impossible de charger les opérateurs."));
      return data;
    },
    enabled: isSoleaspayFlow && !!country,
  });
  const soleaspayCountryEnabled = Boolean(
    soleaspayServiceData?.enabled &&
    soleaspayServiceData.enabledCountries?.some(code => code.toUpperCase() === country),
  );
  const soleaspayOperators: Operator[] = soleaspayCountryEnabled
    ? Object.keys(soleaspayServiceData?.services?.[country] || {}).map(name => ({
        id: name,
        name,
        provider: "soleaspay",
      }))
    : [];

  const { data: sendavaData, isLoading: sendavaLoading } = useQuery<{ success: boolean; data: Operator[] }>({
    queryKey: ["/api/sendavapay/operators", country],
    queryFn: async () => (await fetch(`/api/sendavapay/operators/${country}`, { credentials: "include" })).json(),
    enabled: !!providerInfo && availableProviders.some(item => item.provider === "sendavapay") && !!country,
  });
  const { data: ashtechData, isLoading: ashtechLoading } = useQuery<{
    country: string;
    operators: Array<{ id: string; name: string }>;
  }>({
    queryKey: ["/api/ashtechpay/operators", country],
    queryFn: async () => {
      const response = await fetch(`/api/ashtechpay/operators/${encodeURIComponent(country)}`, {
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Impossible de charger les opérateurs AshtechPay");
      return data;
    },
    enabled: !!providerInfo && availableProviders.some(item => item.provider === "ashtech") && !!country,
  });
  const ashtechOperators: Operator[] = (ashtechData?.operators || []).map((operator) => ({
    ...operator,
    provider: "ashtech",
  }));
  const sendavaOperators: Operator[] = availableProviders.some(item => item.provider === "sendavapay")
    ? (sendavaData?.data || []).filter((x: Operator) => x.status === "online").map(x => ({ ...x, provider: "sendavapay" as const }))
    : [];
  const { data: clapayData, isLoading: clapayLoading } = useQuery<{ operators: Array<{ id: string; name: string; requiresOtp?: boolean }> }>({
    queryKey: ["/api/clapay/operators", country],
    queryFn: async () => {
      const res = await fetch(`/api/clapay/operators/${encodeURIComponent(country)}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(sanitizeDepositDisplayText(data.message, "Impossible de charger les opérateurs."));
      return data;
    },
    enabled: !!providerInfo && availableProviders.some(item => item.provider === "clapay") && !!country,
  });
  const clapayOperators: Operator[] = (clapayData?.operators || []).map((item) => ({
    id: item.id,
    name: item.name,
    requiresOtp: item.requiresOtp,
    provider: "clapay",
  }));
  const automaticOperators: Operator[] = isSoleaspayFlow
    ? soleaspayOperators
    : [...ashtechOperators, ...sendavaOperators, ...clapayOperators];
  const operators: Operator[] = isManualFlow
    ? manualNumbers.map(number => ({
        id: `manual-${number.id}`,
        name: number.operatorName,
        manualNumber: number,
      }))
    : isSoleaspayFlow
      ? soleaspayOperators
      : forcedProvider
        ? automaticOperators
        : [
        ...automaticOperators,
        ...manualNumbers
          .map(number => ({
            id: `manual-${number.id}`,
            name: number.operatorName,
            manualNumber: number,
          })),
          ];
  const countryManualOperatorChoices: Operator[] = isCountrySpecificManualFlow
    ? Array.from(new Set(
        parseOperators(countryInfo?.operators || "[]")
          .map((name) => canonicalManualOperatorName(country, name)),
      )).flatMap((name) => {
        const canonicalName = canonicalManualOperatorName(country, name);
        const configuredNumbers = manualNumbers.filter(
          (number) => canonicalManualOperatorName(country, number.operatorName) === canonicalName,
        );
        return configuredNumbers.length
          ? configuredNumbers.map((number) => ({
              id: `manual-${number.id}`,
              name,
              manualNumber: number,
            }))
          : [{ id: `${country.toLocaleLowerCase()}-unconfigured-${name}`, name }];
      })
    : operators;
  const loadingOperators = isSoleaspayFlow
    ? soleaspayServicesLoading
     : manualNumbersLoading || providerLoading || sendavaLoading || ashtechLoading || clapayLoading;
  const sendavaMutation = useMutation({
    mutationFn: async () => {
      if (!operator?.id) throw new Error("Sélectionnez un opérateur");
      const created = await apiRequest("POST", "/api/sendavapay/create", {
        amount, country, operatorId: operator.id, operatorName: operator.name, payerPhone: paymentPhone,
        feePaymentId,
      });
      if (!created.ok) throw new Error((await created.json()).message || "Création impossible");
      const data = await created.json();
      setDepositId(data.depositId); setPaymentToken(data.paymentToken);
      const initiated = await apiRequest("POST", "/api/sendavapay/initiate", {
        paymentToken: data.paymentToken, payerCountry: country, operatorId: operator.id,
        depositId: data.depositId, payerPhone: paymentPhone,
      });
      if (!initiated.ok) throw new Error((await initiated.json()).message || "Initiation impossible");
      return initiated.json();
    },
    onSuccess: (data) => {
      setMessage(sanitizeDepositDisplayText(data.message, ""));
      if (data.requiresOtp && data.otpToken) { setOtpToken(data.otpToken); setUssd(data.ussdCode || ""); setStep(2); }
      else if (data.requiresRedirect && data.redirectUrl) { setRedirectUrl(data.redirectUrl); setStep(2); }
      else { setStep(2); setStatus("processing"); }
    },
     onError: (e: any) => toast({ title: "Paiement impossible", description: sanitizeDepositDisplayText(e.message, "Le paiement n'a pas pu être initié."), variant: "destructive" }),
  });
  const ashtechMutation = useMutation({
    mutationFn: async (otpCode?: string) => {
      if (!operator?.name) throw new Error("Sélectionnez un opérateur");
      const res = await apiRequest("POST", "/api/ashtechpay/collect", {
        amount, country, operator: operator.name, phone: phone.replace(/\D/g, ""),
        depositId: depositId || undefined, otp: otpCode || undefined,
        feePaymentId,
      });
      if (!res.ok) throw new Error((await res.json()).message || "Initiation impossible");
      return res.json();
    },
    onSuccess: (data) => {
       setAshtechOtpRequired(false);
      setDepositId(data.depositId); setMessage(sanitizeDepositDisplayText(data.message, "")); setUssd(data.ussdCode || "");
      if (data.waveUrl) setRedirectUrl(data.waveUrl);
      setStep(2); setStatus(data.status || "processing");
    },
    onError: (e: any) => {
      if (e.data?.requiresOtp) {
        setDepositId(e.data.depositId || depositId);
        setAshtechOtpRequired(true);
        setUssd(e.data.ussdCode || "");
        setMessage(sanitizeDepositDisplayText(e.message, "Composez le code indiqué puis saisissez votre OTP."));
        setStep(2);
        return;
      }
       toast({ title: "Paiement impossible", description: sanitizeDepositDisplayText(e.message, "Le paiement n'a pas pu être initié."), variant: "destructive" });
    },
  });
  const clapayMutation = useMutation({
    mutationFn: async () => {
      if (!operator?.id || !operator.name) throw new Error("Sélectionnez un opérateur");
      const res = await apiRequest("POST", "/api/clapay/initiate", {
        amount,
        country,
        operatorId: operator.id,
        operatorName: operator.name,
        operatorOtp: operator.requiresOtp ? clapayOperatorOtp.trim() : undefined,
        phone: paymentPhone,
        feePaymentId,
        withdrawalAmount,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(sanitizeDepositDisplayText(data.message, "Impossible d’initier le paiement."));
      return data as { depositId: number; redirectUrl?: string; message?: string; confirmationCode?: string };
    },
    onSuccess: (data) => {
      setDepositId(data.depositId);
      setRedirectUrl(data.redirectUrl || "");
      setClapayConfirmationCode(data.confirmationCode || "");
      setNitaCodeMessage(
        country === "NE" && operator?.name?.toLowerCase().includes("nita") && !data.confirmationCode
          ? "CATL n’a pas encore reçu le code NITA. La page continue la vérification."
          : "",
      );
      setMessage(sanitizeDepositDisplayText(data.message, "Confirmez le paiement sur votre téléphone."));
      setStatus("processing");
      setStep(2);
      queryClient.invalidateQueries({ queryKey: ["/api/deposits/history"] });
    },
    onError: (error: any) => toast({
      title: "Paiement impossible",
      description: sanitizeDepositDisplayText(error.message, "Le paiement n'a pas pu être initié."),
      variant: "destructive",
    }),
  });
  const soleaspayMutation = useMutation({
    mutationFn: async () => {
      if (!operator?.name) throw new Error("Sélectionnez un opérateur");
      const res = await apiRequest("POST", "/api/deposits", {
        amount,
        feePaymentId,
        accountName: user?.fullName || "",
        accountNumber: phone.trim() || user?.phone || "",
        paymentMethod: operator.name,
        country,
        useSoleaspay: true,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(sanitizeDepositDisplayText(data.message, "Dépôt non enregistré"));
      if (!data.deposit?.id) throw new Error("Le serveur n'a pas retourné de référence de dépôt.");
      try {
        sessionStorage.setItem(
          SOLEASPAY_PENDING_DEPOSIT_KEY,
          JSON.stringify({
            depositId: data.deposit.id,
            orderId: data.deposit.soleaspayOrderId || "",
          }),
        );
      } catch {
        // The payment status remains available from the server.
      }
      return data;
    },
    onSuccess: (data) => {
      setDepositId(data.deposit.id);
      setMessage(sanitizeDepositDisplayText(data.message, "Validez la demande de paiement sur votre téléphone."));
      setStatus("pending");
      setStep(2);
      queryClient.invalidateQueries({ queryKey: ["/api/deposits/history"] });
    },
    onError: (e: any) => toast({
      title: "Dépôt non enregistré",
      description: sanitizeDepositDisplayText(e.message, "Impossible d’enregistrer le dépôt."),
      variant: "destructive",
    }),
  });
  const manualMutation = useMutation({
    mutationFn: async () => {
      const number = operator?.manualNumber;
      if (!number) throw new Error("Numéro de paiement indisponible");
      if (!phone.trim()) throw new Error("Saisissez le numéro depuis lequel vous avez payé");
      if (!manualTransactionReference.trim()) throw new Error("Saisissez l'ID de transaction du SMS ou du reçu");
      const res = await apiRequest("POST", "/api/deposits", {
        amount,
        feePaymentId,
        accountName: user?.fullName || "",
        accountNumber: paymentPhone,
        paymentMethod: number.operatorName,
        country,
        paymentNumberId: number.id,
         channelName: number.paymentLink ? `${number.operatorName} - Lien de paiement` : `${number.operatorName} - ${number.phone}`,
        transactionReference: manualTransactionReference.trim(),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Envoi impossible");
      return res.json();
    },
    onSuccess: (data) => {
      const nextDepositId = Number(data.deposit?.id) || null;
      setDepositId(nextDepositId);
      setManualSubmitted(true);
      setStatus("pending");
      setManualVerificationDeadline(nextDepositId ? Date.now() + 5 * 60 * 1000 : null);
      setStep(3);
      queryClient.invalidateQueries({ queryKey: ["/api/deposits/history"] });
    },
      onError: (e: any) => toast({ title: "Dépôt non enregistré", description: sanitizeDepositDisplayText(e.message, "Impossible d’enregistrer le dépôt."), variant: "destructive" }),
  });

  useEffect(() => {
    if (step !== 2 || !depositId || status === "approved" || status === "rejected") return;
    const timer = setInterval(async () => {
      try {
        const url = activeProvider === "ashtech"
          ? `/api/deposits/${depositId}/ashtechpay-status`
          : activeProvider === "soleaspay"
            ? `/api/deposits/${depositId}/verify`
            : activeProvider === "clapay"
              ? `/api/deposits/${depositId}/clapay-status`
              : `/api/deposits/${depositId}/sendavapay-status`;
        const res = await fetch(url, { credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (isNitaClapayFlow) {
            setNitaCodeMessage(sanitizeDepositDisplayText(
              data.message,
              "CATL n’a pas pu récupérer le code de validation NITA. Réessayez ou contactez le service client.",
            ));
          }
          return;
        }
        if (
          activeProvider === "clapay"
          && typeof data.confirmationCode === "string"
          && data.confirmationCode.trim()
        ) {
          setClapayConfirmationCode(data.confirmationCode.trim());
          setNitaCodeMessage("");
        } else if (isNitaClapayFlow && !clapayConfirmationCode) {
          setNitaCodeMessage("En attente du code de validation NITA. CATL continue la vérification.");
        }
        setStatus(data.status);
        if (data.status === "approved") {
          setStep(3);
          clearInterval(timer);
          queryClient.invalidateQueries({ queryKey: ["/api/deposits/history"] });
          if (activeProvider === "soleaspay" || activeProvider === "clapay") refreshUser();
        }
        if (data.status === "rejected") {
          clearInterval(timer);
          toast({ title: "Paiement refusé", variant: "destructive" });
        }
      } catch {
        if (isNitaClapayFlow && !clapayConfirmationCode) {
          setNitaCodeMessage("Connexion interrompue. CATL réessaiera automatiquement.");
        }
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [step, depositId, status, activeProvider, isNitaClapayFlow, clapayConfirmationCode, refreshUser]);

  useEffect(() => {
    if (phonePrefilled.current || !user?.phone || !phonePrefix) return;
    const trimmedPhone = user.phone.trim();
    const prefixDigits = phonePrefix.replace(/\D/g, "");
    let localPhone = trimmedPhone.replace(/\D/g, "");
    if (trimmedPhone.startsWith("+") && localPhone.startsWith(prefixDigits)) {
      localPhone = localPhone.slice(prefixDigits.length);
    } else if (trimmedPhone.startsWith("00") && localPhone.startsWith(`00${prefixDigits}`)) {
      localPhone = localPhone.slice(2 + prefixDigits.length);
    }
    setPhone(localPhone);
    phonePrefilled.current = true;
  }, [user?.phone, phonePrefix]);

  const submitPhone = () => {
    if (!phone.trim()) { toast({ title: "Numéro requis", description: "Saisissez le numéro Mobile Money utilisé.", variant: "destructive" }); return; }
    if (!operator) { toast({ title: "Opérateur requis", description: "Sélectionnez votre opérateur.", variant: "destructive" }); return; }
    if (activeProvider === "clapay" && operator.requiresOtp && !clapayOperatorOtp.trim()) {
      toast({ title: "Code OTP requis", description: "Saisissez le code demandé par cet opérateur.", variant: "destructive" });
      return;
    }
    if (operator.manualNumber) manualMutation.mutate();
    else if (activeProvider === "ashtech") ashtechMutation.mutate(undefined);
    else if (activeProvider === "soleaspay") soleaspayMutation.mutate();
    else if (activeProvider === "clapay") clapayMutation.mutate();
    else sendavaMutation.mutate();
  };
  const submitOtp = async () => {
    if (activeProvider === "ashtech") {
      if (!ashtechOtp.trim()) return;
      ashtechMutation.mutate(ashtechOtp.trim());
      return;
    }
    const res = await apiRequest("POST", "/api/sendavapay/submit-otp", { otpToken, otp });
    if (!res.ok) { toast({ title: "OTP invalide", variant: "destructive" }); return; }
    setStep(2); setStatus("processing");
  };
  const busy = sendavaMutation.isPending || ashtechMutation.isPending || soleaspayMutation.isPending || clapayMutation.isPending || manualMutation.isPending;

  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (
      step !== 3 ||
      !manualSubmitted ||
      !depositId ||
      status !== "pending" ||
      !manualVerificationDeadline
    ) return;

    let cancelled = false;
    let timer: number | undefined;

    const checkManualDepositStatus = async () => {
      try {
        const res = await fetch("/api/deposits/history", { credentials: "include" });
        if (res.ok) {
          const deposits = await res.json() as Array<{ id?: number | string; status?: string }>;
          const currentDeposit = Array.isArray(deposits)
            ? deposits.find(deposit => Number(deposit.id) === depositId)
            : undefined;

          if (currentDeposit?.status === "approved" || currentDeposit?.status === "rejected") {
            if (!cancelled) {
              setStatus(currentDeposit.status);
              queryClient.invalidateQueries({ queryKey: ["/api/deposits/history"] });
              if (currentDeposit.status === "approved") void refreshUser();
            }
            return;
          }
        }
      } catch {
        // Keep checking until the five-minute monitoring window ends.
      }

      if (cancelled || Date.now() >= manualVerificationDeadline) return;
      timer = window.setTimeout(checkManualDepositStatus, 5000);
    };

    void checkManualDepositStatus();
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [step, manualSubmitted, depositId, status, manualVerificationDeadline, queryClient, refreshUser]);

  const copyPaymentNumber = async () => {
    const number = operator?.manualNumber;
    if (!number) return;
    try {
       const value = number.paymentLink
         ? withCoteDIvoireWaveAmount(number.paymentLink, amount, country) || number.paymentLink
         : number.phone || "";
       await navigator.clipboard.writeText(value);
       toast({ title: number.paymentLink ? "Lien copié" : "Numéro copié", description: value });
    } catch {
       toast({ title: number.paymentLink || number.phone || "", description: number.paymentLink ? "Ouvrez le lien pour payer" : "Copiez ce numéro manuellement" });
    }
  };

  const copyClapayConfirmationCode = async () => {
    if (!clapayConfirmationCode) return;
    try {
      await navigator.clipboard.writeText(clapayConfirmationCode);
      toast({ title: "Code copié", description: "Le code de confirmation du dépôt CATL a été copié." });
    } catch {
      toast({ title: "Code de confirmation", description: clapayConfirmationCode });
    }
  };

  const refreshManualPaymentStatus = async () => {
    if (!depositId || manualStatusRefreshing) return;
    setManualStatusRefreshing(true);
    try {
      await withProcessingIndicator(async () => {
        const response = await fetch("/api/deposits/history", { credentials: "include" });
        if (!response.ok) throw new Error("Le statut n’a pas pu être actualisé.");
        const deposits = await response.json() as Array<{ id?: number | string; status?: string }>;
        const currentDeposit = Array.isArray(deposits)
          ? deposits.find((deposit) => Number(deposit.id) === depositId)
          : undefined;
        if (!currentDeposit) throw new Error("Cette demande est introuvable dans l’historique.");
        if (currentDeposit.status === "approved" || currentDeposit.status === "rejected") {
          setStatus(currentDeposit.status);
          if (currentDeposit.status === "approved") void refreshUser();
          queryClient.invalidateQueries({ queryKey: ["/api/deposits/history"] });
        } else {
          toast({ title: "Toujours en attente", description: "Le paiement n’a pas encore été validé." });
        }
      });
    } catch (error) {
      toast({
        title: "Actualisation impossible",
        description: error instanceof Error ? error.message : "Réessayez dans quelques instants.",
        variant: "destructive",
      });
    } finally {
      setManualStatusRefreshing(false);
    }
  };

  const chooseOperator = (nextOperator: Operator) => {
    setOperator(nextOperator);
    setManualTransactionReference("");
    setClapayOperatorOtp("");
    setNitaCodeMessage("");
  };

  const continueFromOperatorSelection = () => {
    if (!operator) {
      toast({ title: "Opérateur requis", description: "Sélectionnez votre opérateur.", variant: "destructive" });
      return;
    }
    if (!phone.trim()) {
      toast({ title: "Numéro requis", description: "Saisissez le numéro utilisé pour effectuer le paiement.", variant: "destructive" });
      return;
    }
    if (isClapayStyledFlow && !isClapayPhoneValid) {
      toast({
        title: "Numéro invalide",
        description: `Saisissez exactement 8 chiffres pour votre numéro Mobile Money${countryInfo?.name ? ` au ${countryInfo.name}` : ""}.`,
        variant: "destructive",
      });
      return;
    }
    const expectedManualPhoneDigits = country === "BJ" || country === "CI" ? 10 : 8;
    if (isCountrySpecificManualFlow && phone.replace(/\D/g, "").length !== expectedManualPhoneDigits) {
      const countryName = country === "BJ" ? "Bénin" : country === "CI" ? "Côte d’Ivoire" : "Togo";
      toast({ title: "Numéro invalide", description: `Saisissez les ${expectedManualPhoneDigits} chiffres de votre numéro Mobile Money au ${countryName}.`, variant: "destructive" });
      return;
    }
    if (isCiManualFlow && hostedManualMethod === "wave" && phone.replace(/\D/g, "").length !== 10) {
      toast({ title: "Numéro invalide", description: "Saisissez les 10 chiffres de votre numéro Wave.", variant: "destructive" });
      return;
    }
    setStep(1);
  };

  if (!amount || !country) return <main className="flex min-h-screen items-center justify-center bg-white p-6 text-center text-[#111827]"><p className="rounded-xl border-2 border-[#111827] bg-white p-5 font-semibold shadow-[0_4px_0_#111827]">Données de dépôt invalides.</p></main>;
  if (isCountrySpecificManualFlow) {
    return (
      <ManualCountryDeposit
        step={step}
        amount={amount}
        currency={currency}
        countryCode={country}
        countryName={countryInfo?.name || (country === "BJ" ? "Bénin" : "Togo")}
        phonePrefix={phonePrefix}
        phoneDigits={country === "BJ" || country === "CI" ? 10 : 8}
        operators={countryManualOperatorChoices}
        isLoadingOperators={loadingOperators}
        hasOperatorsError={manualNumbersError}
        selectedOperator={operator}
        phone={phone}
        onPhoneChange={(value) => setPhone(value.replace(/\D/g, "").slice(0, country === "BJ" || country === "CI" ? 10 : 8))}
        onSelectOperator={chooseOperator}
        onContinue={continueFromOperatorSelection}
        onBack={() => {
          if (step === 0) {
            navigate("/deposit");
            return;
          }
          if (step === 1) {
            setStep(0);
            return;
          }
          navigate("/");
        }}
        onClose={() => navigate("/deposit")}
        transactionReference={manualTransactionReference}
        onTransactionReferenceChange={setManualTransactionReference}
        onCopyPaymentTarget={copyPaymentNumber}
        onSubmit={() => manualMutation.mutate()}
        isSubmitting={manualMutation.isPending}
        status={status}
        depositId={depositId}
        secondsRemaining={manualVerificationSecondsLeft}
        onRefreshStatus={refreshManualPaymentStatus}
        isRefreshing={manualStatusRefreshing}
        onViewHistory={() => navigate("/deposits-history?from=deposit")}
        onHome={() => navigate("/")}
      />
    );
  }
  if (
    isManualFlow &&
    hostedManualMethod &&
    operator?.manualNumber &&
    (step === 1 || (step === 3 && manualSubmitted))
  ) {
    return (
      <HostedPaymentCheckout
        method={hostedManualMethod}
        amount={amount}
        currency={currency}
        countryCode={country}
        countryName={countryInfo?.name || country}
        operatorName={operator.name || operator.manualNumber.operatorName}
        logoUrl={operator.manualNumber.logoUrl}
        paymentLink={operator.manualNumber.paymentLink}
        paymentPhone={operator.manualNumber.phone}
        qrImageUrl={operator.manualNumber.qrImageUrl}
        ownerName={operator.manualNumber.ownerName}
        phonePrefix={phonePrefix}
        payerPhone={phone}
        onPayerPhoneChange={(value) => setPhone(value.replace(/\D/g, "").slice(0, 12))}
        transactionReference={manualTransactionReference}
        onTransactionReferenceChange={setManualTransactionReference}
        onSubmitPayment={() => manualMutation.mutate()}
        isSubmitting={manualMutation.isPending}
        submitted={step === 3 && manualSubmitted}
        status={status}
        depositId={depositId}
        secondsRemaining={manualVerificationSecondsLeft}
        onRefreshStatus={refreshManualPaymentStatus}
        isRefreshing={manualStatusRefreshing}
        onCopyPaymentTarget={copyPaymentNumber}
        onBack={() => {
          setOperator(null);
          setStep(0);
        }}
        onViewHistory={() => navigate("/deposits-history?from=deposit")}
        onHome={() => navigate("/")}
      />
    );
  }
  return (
    <main className={`min-h-[100dvh] text-[#111827] ${isClapayStyledFlow ? "bg-[#f5f5f5] text-[#263342]" : `p-3 sm:p-6 ${isCiManualFlow ? "bg-[#f4f7ff]" : isManualFlow ? "bg-[#FFF0F3]" : "bg-white"}`}`}>
      {!isManualFlow && !isClapayStyledFlow && (
        <aside
          role="timer"
          aria-label={`Compte à rebours de la recharge : ${formatTimeRemaining(checkoutSecondsLeft)}`}
          title="Compte à rebours de la session de recharge"
          className="fixed right-3 top-3 z-50 flex items-center gap-1.5 rounded-full border-2 border-[#111827] bg-white px-2.5 py-1.5 text-sm font-bold text-[#111827] shadow-[0_3px_0_#111827]"
        >
          <Clock3 aria-hidden="true" className="h-4 w-4 text-[#A60026]" />
          <span className="font-mono tabular-nums">{formatTimeRemaining(checkoutSecondsLeft)}</span>
        </aside>
      )}
      <div className={`${isClapayStyledFlow ? "mx-auto min-h-[100dvh] w-full max-w-[520px]" : "mx-auto max-w-xl"}`}>
        <div className={`${isClapayStyledFlow ? "bg-[#00377d] px-4 pb-5 pt-3 text-white shadow-[0_4px_12px_rgba(0,35,82,0.2)] sm:px-5" : isManualFlow ? `rounded-t-2xl ${isCiManualFlow ? "bg-[#1947b8]" : "bg-[#D40030]"} px-4 pb-4 pt-4 text-white sm:px-5` : "px-4 pb-5 pt-3 text-[#111827] sm:px-5 sm:pt-4 sm:pb-6"}`}>
          {isClapayStyledFlow && (
            <div className="relative flex min-h-11 items-center justify-end gap-2 border-b border-white/10 pb-3">
              <div className="absolute left-1/2 top-0 flex h-10 w-[84px] -translate-x-1/2 items-center justify-center rounded-md bg-white px-2 shadow-sm">
                <img src={duluxLogo} alt="Dulux" className="h-7 w-full object-contain" />
              </div>
              {step > 0 && (
                <div className="rounded-md bg-white px-2 py-1 text-center text-[#00377d] shadow-sm" aria-label={`Compte à rebours ${formatTimeRemaining(checkoutSecondsLeft)}`}>
                  <span className="block font-mono text-sm font-bold tabular-nums">{formatTimeRemaining(checkoutSecondsLeft)}</span>
                </div>
              )}
              <button type="button" onClick={() => navigate("/deposit")} aria-label="Fermer le dépôt" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/40 bg-[#082b54] text-white hover:bg-[#001f47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd100]">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          )}
          <div className={`${isClapayStyledFlow ? "pt-4 text-center" : ""}`}>
            <p className={`${isClapayStyledFlow ? "text-xs font-extrabold text-[#ffd100]" : isManualFlow ? "text-sm text-white/90" : "text-sm text-[#5b2500]"} font-bold uppercase tracking-[0.12em]`}>{isClapayStyledFlow ? "Montant à payer" : isManualFlow ? "Montant" : "Montant du dépôt"}</p>
            <p className={`mt-1 ${isManualFlow || isClapayStyledFlow ? "text-3xl" : "text-4xl"} font-extrabold tracking-tight ${isClapayStyledFlow ? "leading-none text-[#ffd100]" : ""}`}>
              {isClapayStyledFlow && <span className="mr-1 text-xl font-bold">{currency}</span>}
              {amount.toLocaleString("fr-FR")}
              {!isClapayStyledFlow && <span className="text-2xl font-bold"> {currency}</span>}
            </p>
          </div>
        </div>
        <section className={`${isClapayStyledFlow ? "rounded-b-2xl border border-[#d9e4fb] shadow-[0_8px_24px_rgba(0,35,82,0.08)]" : `rounded-2xl ${isCiManualFlow ? "border border-[#d9e4fb] shadow-[0_12px_34px_rgba(21,66,153,0.12)]" : "border-2 border-[#111827] shadow-[0_5px_0_#111827,0_10px_18px_rgba(17,24,39,0.18)]"}`} bg-white ${isManualFlow ? "rounded-t-none p-4 sm:p-5" : isClapayStyledFlow ? "p-4 sm:p-5" : "p-4 sm:p-6"}`}>
            {isManualFlow ? (
              <Stepper
                step={manualStepperStep}
                labels={["Opérateur", "Compte de paiement", "Vérification"]}
                accentColor={isCiManualFlow ? "#1947b8" : "#D40030"}
              />
            ) : step > 0 ? (
              <Stepper
                step={Math.max(0, Math.min(2, step - 1))}
                labels={isClapayStyledFlow ? ["Opérateur", "Autorisation", "Confirmation"] : undefined}
                accentColor={isClapayStyledFlow ? "#00377d" : undefined}
              />
            ) : null}
          {step === 0 && (
            <div className="space-y-4">
                <p className="px-1 text-lg font-bold text-[#111827]">
                {isManualFlow
                   ? "Sélectionnez un opérateur Mobile Money"
                  : isClapayStyledFlow
                    ? "Sélectionnez votre opérateur"
                  : isSoleaspayFlow
                    ? "Sélectionnez votre opérateur Mobile Money :"
                    : "Sélectionnez le mode de paiement :"}
              </p>
                {(isManualFlow || isClapayStyledFlow) && <p className="px-1 text-sm leading-6 text-gray-600">{isClapayStyledFlow ? "Choisissez un opérateur disponible, puis entrez le numéro Mobile Money qui recevra la demande de paiement." : `Choisissez l’opérateur du compte auquel vous allez envoyer ${amount.toLocaleString()} ${currency}.`}</p>}
                {loadingOperators ? <Loader2 className={`w-7 h-7 animate-spin mx-auto ${isClapayStyledFlow ? "text-[#00377d]" : isCiManualFlow ? "text-[#1947b8]" : "text-[#D40030]"}`} /> : operators.length === 0 ? <p className="text-center text-gray-500">{manualNumbersError && isManualFlow ? "Impossible de charger les moyens de paiement. Réessayez." : providerError instanceof Error ? sanitizeDepositDisplayText(providerError.message, "Aucun opérateur disponible pour ce pays.") : "Aucun opérateur disponible pour ce pays."}</p> : (
                  <div className={`grid gap-3 sm:gap-4 ${isClapayStyledFlow ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2"}`}>
                    {operators.map((op, i) => {
                      const logoUrl = op.manualNumber?.logoUrl || (isClapayStyledFlow ? clapayOperatorLogo(country, op.name) : null);
                      const isSelected = operator?.id === op.id && operator?.name === op.name && operator?.provider === op.provider;
                      return (
                      <button
                        key={`${op.id || op.name}-${i}`}
                        type="button"
                        onClick={() => chooseOperator(op)}
                        aria-pressed={isSelected}
                        aria-label={`Sélectionner ${op.name || op.code || "cet opérateur"}`}
                        className={`group w-full text-left transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-4 ${
                          isClapayStyledFlow
                            ? "flex min-h-[76px] items-center gap-3 rounded-xl border-2 border-[#d7dce3] bg-white px-3 py-3 shadow-[0_3px_8px_rgba(15,35,60,0.08)] focus-visible:ring-[#00377d]/15 hover:border-[#00377d]/60 sm:min-h-[84px] sm:p-4"
                            : `flex min-h-[112px] flex-col items-start justify-between gap-3 rounded-xl border-2 border-[#111827] bg-white p-3 shadow-[0_3px_0_#111827,0_6px_12px_rgba(17,24,39,0.12)] focus-visible:ring-4 ${isCiManualFlow ? "focus-visible:ring-[#1947b8]/25 hover:bg-[#f6f9ff]" : "focus-visible:ring-[#D40030]/25 hover:bg-[#FFF8FA]"} hover:-translate-y-0.5 hover:shadow-[0_5px_0_#111827,0_9px_16px_rgba(17,24,39,0.16)] sm:min-h-[124px] sm:p-4`
                        } focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                          isSelected
                            ? isClapayStyledFlow
                              ? "border-[#00377d] bg-[#f2f6fc] ring-2 ring-[#00377d]/15 shadow-[0_3px_8px_rgba(0,35,82,0.12)]"
                              : isCiManualFlow
                              ? "border-[#1947b8] bg-[#f0f5ff] ring-2 ring-[#1947b8]/25 shadow-[0_3px_0_#173f9d,0_6px_12px_rgba(17,24,39,0.12)]"
                              : "border-[#D40030] bg-[#FFF0F3] ring-2 ring-[#D40030]/25 shadow-[0_3px_0_#111827,0_6px_12px_rgba(17,24,39,0.12)]"
                            : ""
                        }`}
                      >
                        <span className="flex w-full min-w-0 items-center justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-2.5">
                          {logoUrl ? (
                            <img src={logoUrl} alt="" aria-hidden="true" className={`shrink-0 rounded-lg border border-[#e4e7ec] bg-white object-contain p-1 ${isClapayStyledFlow ? "h-11 w-11" : "h-9 w-9 sm:h-10 sm:w-10"}`} />
                          ) : (
                            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg border ${isClapayStyledFlow ? "border-[#d7e2f2] bg-[#eef3fa] text-[#00377d]" : isCiManualFlow ? "border-[#cbdaf7] bg-[#eef4ff] text-[#1947b8]" : "border-[#E7A2B2] bg-[#FFF0F3] text-[#D40030]"}`}>
                              <Phone className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                            </span>
                          )}
                          <span className="min-w-0">
                            <span className={`block truncate text-base leading-snug sm:text-lg ${isClapayStyledFlow ? "font-extrabold text-[#17345b]" : "font-bold text-[#111827]"}`}>{op.name}</span>
                            {op.manualNumber?.ownerName && <span className="mt-0.5 block truncate text-xs font-medium text-gray-500">{op.manualNumber.ownerName}</span>}
                          </span>
                          </span>
                          <ChevronRight
                            aria-hidden="true"
                            className={`h-5 w-5 shrink-0 transition-transform duration-200 ${
                              isSelected
                                ? `translate-x-0.5 ${isClapayStyledFlow ? "text-[#00377d]" : isCiManualFlow ? "text-[#1947b8]" : "text-[#A60026]"}`
                                : `text-gray-500 group-hover:translate-x-0.5 ${isClapayStyledFlow ? "group-hover:text-[#00377d]" : isCiManualFlow ? "group-hover:text-[#1947b8]" : "group-hover:text-[#A60026]"}`
                            }`}
                          />
                        </span>
                        {op.manualNumber?.phone && (
                          <span className={`w-full border-t pt-2 font-mono text-sm font-semibold tabular-nums ${isCiManualFlow ? "border-[#dce7fb] text-[#23457f]" : "border-[#E7A2B2]/70 text-[#5A1728]"}`}>
                            {op.manualNumber.phone}
                          </span>
                        )}
                      </button>
                      );
                    })}
                  </div>
              )}
              <div className="space-y-1.5">
                <label htmlFor="robotpay-payer-phone-selection" className="block text-sm font-semibold text-[#111827]">
                  {isClapayStyledFlow ? "Votre numéro Mobile Money" : "Numéro du payeur"} <span className={isClapayStyledFlow ? "text-[#00377d]" : isCiManualFlow ? "text-[#1947b8]" : "text-[#D40030]"}>*</span>
                </label>
                <div className={`flex items-center ${isClapayStyledFlow ? "min-h-[54px] overflow-hidden rounded-xl border-2 border-[#00377d] bg-white shadow-[0_3px_8px_rgba(0,35,82,0.1)] focus-within:ring-2 focus-within:ring-[#00377d]/15" : `rounded-[11px] border-2 border-[#111827] px-3 shadow-[0_2px_5px_rgba(17,24,39,0.1)] transition focus-within:ring-2 ${isCiManualFlow ? "focus-within:border-[#1947b8] focus-within:ring-[#1947b8]/15" : "focus-within:border-[#D40030] focus-within:ring-[#D40030]/15"}`}`}>
                  {isClapayStyledFlow ? (
                    <span className="flex min-h-[50px] min-w-[72px] items-center justify-center bg-[#00377d] px-3 text-base font-extrabold text-white">+{phonePrefix}</span>
                  ) : (
                    <>
                      <Phone className={`h-4 w-4 shrink-0 ${isCiManualFlow ? "text-[#1947b8]" : "text-[#D40030]"}`} aria-hidden="true" />
                      <span className="ml-2 shrink-0 border-r border-gray-300 pr-2 text-[#111827]">+{phonePrefix}</span>
                    </>
                  )}
                  <input
                    id="robotpay-payer-phone-selection"
                    value={phone}
                    onChange={event => setPhone(event.target.value.replace(/\D/g, "").slice(0, isClapayStyledFlow ? 8 : 12))}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    aria-required="true"
                    maxLength={isClapayStyledFlow ? 8 : 12}
                    className="w-full min-w-0 bg-transparent px-3 py-2.5 text-[#111827] outline-none placeholder:text-sm placeholder:text-[#98a2b3]"
                  />
                </div>
                {isClapayStyledFlow && (
                  <div className="flex items-start gap-2 rounded-lg border border-[#f0dfa0] bg-[#fff7cf] px-3 py-3 text-xs leading-5 text-[#695b20]">
                    <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>Saisissez les 8 chiffres du numéro Mobile Money utilisé pour le dépôt CATL. La demande de paiement sera ensuite envoyée sur ce numéro.</p>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={continueFromOperatorSelection}
                disabled={!canContinueFromOperatorSelection}
                className={`w-full rounded-[11px] border-2 py-3 font-bold text-white transition active:translate-y-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed ${isClapayStyledFlow
                  ? canContinueFromOperatorSelection
                    ? "border-[#002b61] bg-[#00377d] shadow-[0_3px_0_#002b61,0_5px_10px_rgba(0,35,82,0.16)] hover:bg-[#002b61] focus-visible:ring-[#00377d]"
                    : "border-[#c1cad5] bg-[#bdc9d8] shadow-none"
                  : `disabled:opacity-50 ${isCiManualFlow ? "border-[#173f9d] bg-[#1947b8] shadow-[0_3px_0_#173f9d,0_5px_10px_rgba(17,24,39,0.16)] hover:bg-[#153f9f] focus-visible:ring-[#1947b8]" : "border-[#111827] bg-[#D40030] shadow-[0_3px_0_#111827,0_5px_10px_rgba(17,24,39,0.16)] hover:bg-[#A60026] focus-visible:ring-[#D40030]"}`
                } active:shadow-[0_1px_0_#111827]`}
              >
                {hostedManualMethod === "wave" ? "Soumettre" : isClapayStyledFlow ? "Suivant" : "Continuer"}
              </button>
              {isClapayStyledFlow && (
                <div className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#d8eee4] bg-[#ecfbf4] px-4 py-3 text-sm font-bold text-[#41806a]">
                  <ShieldCheck aria-hidden="true" className="h-5 w-5 shrink-0" />
                  <span>Chiffré et sécurisé</span>
                </div>
              )}
            </div>
          )}
          {step === 1 && isManualFlow && operator?.manualNumber && (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#E7A2B2] bg-[#FFF0F3] px-4 py-3 text-sm font-semibold leading-6 text-[#5A1728]">
                Envoyez <strong>{amount.toLocaleString()} {currency}</strong> sur le compte de paiement ci-dessous. Vérifiez le nom du bénéficiaire avant le transfert.
              </div>

              <section aria-label="Compte de paiement" className="space-y-3 rounded-xl border-2 border-[#111827] bg-white p-4 shadow-[0_3px_0_#111827,0_6px_12px_rgba(17,24,39,0.1)]">
                <div className="flex items-center justify-between gap-3 border-b border-gray-200 pb-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500">Méthode de transfert</p>
                    <p className="mt-1 text-lg font-bold text-[#111827]">{operator.name || operator.manualNumber.operatorName}</p>
                  </div>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#FFF0F3] text-[#D40030]">
                    <Phone aria-hidden="true" className="h-5 w-5" />
                  </span>
                </div>
                {operator.manualNumber.ownerName && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500">Nom du bénéficiaire</p>
                    <p className="mt-1 font-semibold text-[#111827]">{operator.manualNumber.ownerName}</p>
                  </div>
                )}
                {operator.manualNumber.paymentLink ? (
                  <a
                    href={withCoteDIvoireWaveAmount(operator.manualNumber.paymentLink, amount, country) || operator.manualNumber.paymentLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 border-[#D40030] bg-white px-3 text-sm font-bold text-[#A60026] underline-offset-2 hover:bg-[#FFF8FA]"
                  >
                    <ExternalLink aria-hidden="true" className="h-4 w-4" /> Ouvrir le lien de paiement
                  </a>
                ) : (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500">Numéro du compte</p>
                    <p className="mt-1 break-all font-mono text-xl font-bold tracking-wide text-[#111827]">{operator.manualNumber.phone}</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={copyPaymentNumber}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[11px] border-2 border-[#111827] bg-[#D40030] px-4 py-2 font-bold text-white shadow-[0_3px_0_#111827,0_5px_10px_rgba(17,24,39,0.14)] transition hover:bg-[#A60026] active:translate-y-[2px] active:shadow-[0_1px_0_#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D40030] focus-visible:ring-offset-2"
                >
                  <Copy aria-hidden="true" className="h-4 w-4" /> Copier les coordonnées
                </button>
              </section>

              <div className="rounded-xl border-2 border-[#111827] bg-white px-4 py-3 text-sm text-gray-700 shadow-[0_2px_0_#111827]">
                Montant à transférer : <strong className="text-[#111827]">{amount.toLocaleString()} {currency}</strong>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="flex-1 rounded-[11px] border-2 border-[#111827] bg-white py-3 font-semibold text-[#111827] shadow-[0_3px_0_#111827] transition active:translate-y-[2px] active:shadow-[0_1px_0_#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D40030] focus-visible:ring-offset-2"
                >
                  Précédent
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 rounded-[11px] border-2 border-[#111827] bg-[#D40030] py-3 font-bold text-white shadow-[0_3px_0_#111827,0_5px_10px_rgba(17,24,39,0.14)] transition hover:bg-[#A60026] active:translate-y-[2px] active:shadow-[0_1px_0_#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D40030] focus-visible:ring-offset-2"
                >
                  Suivant <ChevronRight aria-hidden="true" className="ml-1 inline h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          {step === 1 && !isManualFlow && (
            <div className={operator?.manualNumber ? "space-y-3" : "space-y-5"}>
              {isBjClapayFlow && (
                <section aria-label="Récapitulatif du dépôt automatique" className="space-y-3 rounded-xl border-2 border-[#d7e2f2] bg-[#f8fbff] p-4 shadow-[0_3px_8px_rgba(0,35,82,0.08)]">
                  <h2 className="text-base font-extrabold text-[#17345b]">Vérifiez les informations du dépôt</h2>
                  <div className="space-y-2 rounded-lg border border-[#d7e2f2] bg-white p-3 text-sm">
                    <div className="flex justify-between gap-3"><span className="font-semibold text-[#667085]">Opérateur</span><span className="text-right font-bold text-[#17345b]">{operator?.name}</span></div>
                    <div className="flex justify-between gap-3"><span className="font-semibold text-[#667085]">Numéro</span><span className="text-right font-mono font-bold text-[#17345b]">{paymentPhone}</span></div>
                    <div className="flex justify-between gap-3"><span className="font-semibold text-[#667085]">Montant</span><span className="text-right font-extrabold text-[#00377d]">{amount.toLocaleString("fr-FR")} {currency}</span></div>
                  </div>
                  <p className="text-sm leading-5 text-[#536274]">Une demande de paiement sécurisée sera envoyée à votre opérateur. Validez-la sur votre téléphone pour terminer le dépôt.</p>
                </section>
              )}
              {operator?.manualNumber && (
                <section
                  aria-label="Informations de paiement manuel"
                  className="mx-auto w-full max-w-md rounded-2xl border-2 border-[#111827] bg-white p-2.5 text-center shadow-[0_3px_0_#111827,0_7px_14px_rgba(17,24,39,0.14)]"
                >
                  <div className="mb-2 border-b border-gray-200 pb-2 text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-600">
                      {operator.name || operator.code || "Paiement"} · {operator.manualNumber.paymentLink ? "Lien" : "Numéro"}
                    </p>
                  </div>
                  {operator.manualNumber.paymentLink ? (
                    <div className="flex min-h-10 items-center justify-center rounded-xl border-2 border-[#111827] bg-white px-3 py-1.5 shadow-[0_2px_5px_rgba(17,24,39,0.12)]">
                      <a
                        href={withCoteDIvoireWaveAmount(operator.manualNumber.paymentLink, amount, country) || operator.manualNumber.paymentLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-w-0 items-center justify-center gap-1.5 text-center text-sm font-semibold text-[#111827] underline decoration-[#D40030] underline-offset-2"
                      >
                        <ExternalLink aria-hidden="true" className="h-4 w-4 shrink-0" /> Ouvrir le lien
                      </a>
                    </div>
                  ) : (
                    <div className="flex min-h-10 items-center justify-center rounded-xl border-2 border-[#111827] bg-white px-3 py-1.5 shadow-[0_2px_5px_rgba(17,24,39,0.12)]">
                      <p className="break-all text-center font-mono text-lg font-bold tabular-nums tracking-[0.06em] text-[#17324d]">
                        {operator.manualNumber.phone}
                      </p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={copyPaymentNumber}
                    aria-label={operator.manualNumber.paymentLink
                      ? "Copier le lien de paiement"
                      : `Copier le numéro ${operator.manualNumber.phone}`}
                    className="mx-auto mt-2 flex h-9 min-w-24 items-center justify-center gap-1.5 rounded-[11px] border-2 border-[#111827] bg-[#D40030] px-3 text-xs font-bold text-white shadow-[0_3px_0_#111827,0_5px_10px_rgba(17,24,39,0.16)] transition duration-150 hover:bg-[#A60026] active:translate-y-[2px] active:shadow-[0_1px_0_#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D40030] focus-visible:ring-offset-2"
                  >
                    <Copy aria-hidden="true" className="h-4 w-4" /> Copier
                  </button>
                </section>
              )}
              {activeProvider === "clapay" && operator?.requiresOtp && (
                <div className="text-left">
                  {country === "BF" && isClapayStyledFlow && (
                    <div role="note" className="mb-3 rounded-lg border border-[#f0dfa0] bg-[#fff7cf] px-3 py-3 text-sm leading-5 text-[#695b20]">
                      <p className="font-semibold">Pour obtenir votre code OTP, composez ce code USSD :</p>
                      <code className="mt-2 block break-all rounded-md bg-white px-3 py-2 text-center font-mono text-base font-bold tracking-wide text-[#17345b]">
                        {`*144*4*6*${Math.trunc(amount)}#`}
                      </code>
                    </div>
                  )}
                  <label htmlFor="robotpay-clapay-operator-otp" className="mb-1.5 block text-sm font-semibold text-[#111827]">
                    Code OTP opérateur <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="robotpay-clapay-operator-otp"
                    value={clapayOperatorOtp}
                    onChange={event => setClapayOperatorOtp(event.target.value.trim().slice(0, 64))}
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    className={`w-full rounded-[11px] border-2 px-3 py-2.5 text-center font-mono text-lg text-[#111827] outline-none transition ${isBjClapayFlow ? "border-[#cbd6e2] focus:border-[#00377d] focus:ring-2 focus:ring-[#00377d]/15" : "border-[#111827] focus:border-[#D40030] focus:ring-2 focus:ring-[#D40030]/15"}`}
                  />
                  <p className="mt-1 text-xs text-gray-600">Saisissez le code demandé par votre opérateur Mobile Money.</p>
                </div>
              )}
              {operator?.manualNumber && (
                <div className="border-t border-gray-200 pt-3 text-left">
                  <label htmlFor="robotpay-transaction-reference" className="mb-1.5 block text-sm font-semibold text-[#111827]">
                    ID de transaction <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center rounded-[11px] border-2 border-[#111827] px-3 shadow-[0_2px_5px_rgba(17,24,39,0.1)] transition focus-within:border-[#D40030] focus-within:ring-2 focus-within:ring-[#D40030]/15">
                    <input
                      id="robotpay-transaction-reference"
                      type="text"
                      value={manualTransactionReference}
                      onChange={event => setManualTransactionReference(event.target.value)}
                      maxLength={120}
                      autoComplete="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="ID du SMS ou du reçu"
                      aria-required="true"
                      className="w-full min-w-0 px-3 py-2.5 text-center font-mono tracking-wide text-[#111827] placeholder:font-sans placeholder:text-sm placeholder:tracking-normal placeholder:text-gray-500 outline-none"
                    />
                  </div>
                </div>
              )}
              <div className="flex items-center justify-center gap-3 pt-1">
                <button onClick={() => { setOperator(null); setStep(0); }} className={`flex-1 rounded-[11px] border-2 bg-white py-2.5 font-semibold text-[#111827] transition active:translate-y-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${isBjClapayFlow ? "border-[#cbd6e2] shadow-[0_3px_8px_rgba(15,35,60,0.08)] focus-visible:ring-[#00377d]" : "border-[#111827] shadow-[0_3px_0_#111827] active:shadow-[0_1px_0_#111827] focus-visible:ring-[#D40030]"}`}>Retour</button>
               <button onClick={submitPhone} disabled={busy || !phone.trim() || (activeProvider === "clapay" && !!operator?.requiresOtp && !clapayOperatorOtp.trim()) || (!!operator?.manualNumber && !manualTransactionReference.trim())} className={`flex-1 rounded-[11px] border-2 py-2.5 font-bold text-white transition active:translate-y-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${isBjClapayFlow ? "border-[#002b61] bg-[#00377d] shadow-[0_3px_8px_rgba(0,35,82,0.16)] hover:bg-[#002b61] focus-visible:ring-[#00377d]" : "border-[#111827] bg-[#D40030] shadow-[0_3px_0_#111827,0_5px_10px_rgba(17,24,39,0.16)] hover:bg-[#A60026] active:shadow-[0_1px_0_#111827] focus-visible:ring-[#D40030]"}`}>{busy ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : operator?.manualNumber ? "Vérifier" : isBjClapayFlow ? "Lancer le dépôt" : "Continuer"}</button>
              </div>
            </div>
          )}
          {step === 2 && isManualFlow && (
            <div className="space-y-4">
              <div className="rounded-xl border-2 border-[#E7A2B2] bg-[#FFF8FA] p-4 text-sm leading-6 text-gray-700">
                <h2 className="mb-2 text-base font-bold text-[#111827]">Une information importante</h2>
                <p>
                  Après le transfert, indiquez le numéro utilisé pour payer et l’ID de transaction reçu par SMS ou sur le reçu.
                  Votre dépôt sera créé <strong>en attente de vérification</strong> ; le solde ne sera crédité qu’après validation.
                </p>
                {operator?.manualNumber && (
                  <div className="mt-3 rounded-lg bg-white px-3 py-2 text-sm">
                    <p><strong>Méthode :</strong> {operator.name}</p>
                    {operator.manualNumber.ownerName && <p><strong>Bénéficiaire :</strong> {operator.manualNumber.ownerName}</p>}
                    <p><strong>Montant à envoyer :</strong> {amount.toLocaleString()} {currency}</p>
                    <p className="break-all"><strong>Compte :</strong> {operator.manualNumber.paymentLink || operator.manualNumber.phone}</p>
                    <p><strong>Numéro du payeur :</strong> {paymentPhone}</p>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="robotpay-transaction-reference" className="mb-1.5 block text-sm font-semibold text-[#111827]">
                  ID de transaction <span className="text-[#D40030]">*</span>
                </label>
                <div className="flex items-center rounded-[11px] border-2 border-[#111827] px-3 shadow-[0_2px_5px_rgba(17,24,39,0.1)] transition focus-within:border-[#D40030] focus-within:ring-2 focus-within:ring-[#D40030]/15">
                  <input
                    id="robotpay-transaction-reference"
                    type="text"
                    value={manualTransactionReference}
                    onChange={event => setManualTransactionReference(event.target.value)}
                    maxLength={120}
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="ID indiqué dans le SMS ou sur le reçu"
                    aria-required="true"
                    className="w-full min-w-0 px-3 py-3 font-mono tracking-wide text-[#111827] placeholder:font-sans placeholder:text-sm placeholder:tracking-normal placeholder:text-gray-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-[11px] border-2 border-[#111827] bg-white py-3 font-semibold text-[#111827] shadow-[0_3px_0_#111827] transition active:translate-y-[2px] active:shadow-[0_1px_0_#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D40030] focus-visible:ring-offset-2"
                >
                  Précédent
                </button>
                <button
                  type="button"
                  onClick={() => manualMutation.mutate()}
                  disabled={busy || !phone.trim() || !manualTransactionReference.trim()}
                  className="flex-1 rounded-[11px] border-2 border-[#111827] bg-[#D40030] py-3 font-bold text-white shadow-[0_3px_0_#111827,0_5px_10px_rgba(17,24,39,0.14)] transition hover:bg-[#A60026] active:translate-y-[2px] active:shadow-[0_1px_0_#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D40030] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {manualMutation.isPending ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "J’ai effectué le paiement"}
                </button>
              </div>
            </div>
          )}
          {step === 2 && !isManualFlow && (
            <div className="space-y-5 text-center">
              {activeProvider === "clapay" && clapayConfirmationCode && (
                <section
                  aria-label="Code de confirmation du dépôt CATL"
                  role="status"
                  className={`rounded-xl border-2 p-4 text-left ${isBjClapayFlow ? "border-[#d7e2f2] bg-[#f2f6fc] shadow-[0_3px_8px_rgba(0,35,82,0.08)]" : "border-[#111827] bg-[#FFF0F3] shadow-[0_3px_0_#111827,0_6px_12px_rgba(17,24,39,0.1)]"}`}
                >
                  <p className={`text-sm font-bold uppercase tracking-[0.08em] ${isBjClapayFlow ? "text-[#00377d]" : "text-[#A60026]"}`}>
                    Code de confirmation{operator?.name?.toLowerCase().includes("nita") ? " NITA" : ""}
                  </p>
                  <p className={`mt-2 break-all text-center font-mono text-2xl font-extrabold tracking-[0.12em] ${isBjClapayFlow ? "text-[#17345b]" : "text-[#111827]"}`}>
                    {clapayConfirmationCode}
                  </p>
                  <p className="mt-2 text-sm leading-5 text-gray-700">
                    {operator?.name?.toLowerCase().includes("nita")
                      ? "Présentez ce code dans NITA pour confirmer le paiement."
                      : "Utilisez ce code pour terminer la confirmation du paiement auprès de l’opérateur."}
                  </p>
                  <button
                    type="button"
                    onClick={copyClapayConfirmationCode}
                    className={`mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-[11px] border-2 px-3 py-2 text-sm font-bold text-white transition active:translate-y-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${isBjClapayFlow ? "border-[#002b61] bg-[#00377d] shadow-[0_2px_8px_rgba(0,35,82,0.12)] hover:bg-[#002b61] focus-visible:ring-[#00377d]" : "border-[#111827] bg-[#D40030] shadow-[0_2px_0_#111827] hover:bg-[#A60026] active:shadow-none focus-visible:ring-[#D40030]"}`}
                  >
                    <Copy aria-hidden="true" className="h-4 w-4" /> Copier le code
                  </button>
                </section>
              )}
              {isNitaClapayFlow && !clapayConfirmationCode && status !== "rejected" && (
                <section
                  aria-label="Récupération du code de confirmation NITA"
                  role="status"
                  aria-live="polite"
                  className="rounded-xl border-2 border-[#d7e2f2] bg-[#f2f6fc] p-4 text-left shadow-[0_3px_8px_rgba(0,35,82,0.08)]"
                >
                  <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#00377d]">
                    Code de confirmation NITA
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#17345b]">
                    {nitaCodeMessage || "CATL récupère automatiquement le code de validation. Gardez cette page ouverte."}
                  </p>
                </section>
              )}
              {redirectUrl ? (
                <>
                  <p className="text-gray-700">{message || "Ouvrez la page sécurisée pour terminer votre paiement."}</p>
                  <a
                    href={redirectUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`block rounded-[11px] border-2 py-3 font-bold text-white transition active:translate-y-[2px] ${isBjClapayFlow ? "border-[#002b61] bg-[#00377d] shadow-[0_3px_8px_rgba(0,35,82,0.16)] hover:bg-[#002b61]" : "border-[#111827] bg-[#D40030] shadow-[0_3px_0_#111827,0_5px_10px_rgba(17,24,39,0.16)] hover:bg-[#A60026] active:shadow-[0_1px_0_#111827]"}`}
                  >
                    Ouvrir la page de paiement
                  </a>
                </>
              ) : (otpToken || ashtechOtpRequired) ? (
                <>
                  {ussd && <p className={`rounded-lg border px-3 py-3 text-center font-mono text-xl font-bold tracking-widest ${isBjClapayFlow ? "border-[#d7e2f2] bg-[#f2f6fc] text-[#00377d]" : "border-rose-200 bg-rose-50 text-[#A60026]"}`}>{ussd}</p>}
                  <p className="text-sm text-gray-600">{ussd ? "Composez ce code sur votre téléphone pour obtenir le code OTP, puis saisissez-le ci-dessous." : "Un code OTP vous a été envoyé. Saisissez-le ci-dessous."}</p>
                  <input
                    value={activeProvider === "ashtech" ? ashtechOtp : otp}
                    onChange={e => activeProvider === "ashtech" ? setAshtechOtp(e.target.value.replace(/\D/g, "")) : setOtp(e.target.value)}
                    inputMode="numeric"
                    placeholder="Saisissez le code OTP"
                    className={`w-full rounded-[11px] border-2 p-3 text-center text-xl text-[#111827] outline-none transition ${isBjClapayFlow ? "border-[#cbd6e2] focus:border-[#00377d] focus:ring-2 focus:ring-[#00377d]/15" : "border-[#111827] focus:border-[#D40030] focus:ring-2 focus:ring-[#D40030]/15"}`}
                  />
                  <button
                    onClick={submitOtp}
                    disabled={busy}
                    className={`w-full rounded-[11px] border-2 py-3 font-bold text-white transition active:translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-50 ${isBjClapayFlow ? "border-[#002b61] bg-[#00377d] shadow-[0_3px_8px_rgba(0,35,82,0.16)] hover:bg-[#002b61] focus-visible:ring-2 focus-visible:ring-[#00377d]" : "border-[#111827] bg-[#D40030] shadow-[0_3px_0_#111827,0_5px_10px_rgba(17,24,39,0.16)] hover:bg-[#A60026] active:shadow-[0_1px_0_#111827]"}`}
                  >
                    Confirmer
                  </button>
                </>
              ) : status === "rejected" ? (
                <>
                  <ShieldCheck className="mx-auto h-16 w-16 text-red-400" />
                  <p className="text-lg font-semibold text-red-600">Paiement refusé</p>
                  <p className="text-sm text-gray-500">Le paiement n’a pas été confirmé. Vous pouvez réessayer.</p>
                  <button
                    onClick={() => { setDepositId(null); setStatus("pending"); setStep(1); }}
                    className={`w-full rounded-[11px] border-2 py-3 font-bold text-white shadow transition active:translate-y-[2px] ${isBjClapayFlow ? "border-[#002b61] bg-[#00377d] shadow-[0_3px_8px_rgba(0,35,82,0.16)] hover:bg-[#002b61] active:shadow-none" : "border-[#111827] bg-[#D40030] shadow-[0_3px_0_#111827,0_5px_10px_rgba(17,24,39,0.16)] hover:bg-[#A60026] active:shadow-[0_1px_0_#111827]"}`}
                  >
                    Réessayer
                  </button>
                </>
              ) : (
                <>
                  <ShieldCheck className={`mx-auto h-16 w-16 animate-pulse ${isBjClapayFlow ? "text-[#00377d]" : "text-green-400"}`} />
                  <p className={`text-lg font-semibold ${isBjClapayFlow ? "text-[#17345b]" : ""}`}>Paiement en cours de confirmation</p>
                  <p className="text-sm text-gray-500">{message || "Validez la demande sur votre téléphone. La page se met à jour automatiquement."}</p>
                </>
              )}
            </div>
          )}
          {step === 3 && (
            manualSubmitted ? (
              <div className="space-y-5 py-2 text-center">
                <div className="border-b border-gray-200 pb-3 text-left">
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500">Paiement manuel · {countryInfo?.name || country}</p>
                  <p className="mt-1 text-2xl font-extrabold text-[#111827]">{amount.toLocaleString()} {currency}</p>
                </div>
                {status === "approved" ? (
                  <div role="status" className="rounded-xl border-2 border-green-200 bg-green-50 p-4 text-left">
                    <p className="flex items-center gap-2 font-bold text-green-800"><Check aria-hidden="true" className="h-5 w-5" /> Paiement confirmé</p>
                    <p className="mt-1 text-sm leading-6 text-green-800">Votre dépôt a été approuvé et votre solde a été mis à jour.</p>
                  </div>
                ) : status === "rejected" ? (
                  <div role="status" className="rounded-xl border-2 border-red-200 bg-red-50 p-4 text-left">
                    <p className="font-bold text-red-700">Demande refusée</p>
                    <p className="mt-1 text-sm leading-6 text-red-700">Le dépôt n’a pas été approuvé. Consultez l’historique ou contactez le service client si nécessaire.</p>
                  </div>
                ) : (
                  <div role="status" aria-live="polite" className="rounded-xl border-2 border-[#E7A2B2] bg-[#FFF0F3] p-4">
                    <p className="flex items-center justify-center gap-2 font-bold text-[#A60026]">
                      <Clock3 aria-hidden="true" className="h-5 w-5" />
                      En attente de confirmation du paiement
                    </p>
                    <p className="mt-1 text-sm leading-6 text-gray-700">Votre demande est enregistrée et sera examinée. Le compteur ci-dessous est une fenêtre de suivi, pas une confirmation de paiement.</p>
                  </div>
                )}

                {status !== "approved" && status !== "rejected" && (
                  <div className="rounded-xl border-2 border-[#111827] bg-white px-4 py-5 shadow-[0_3px_0_#111827]">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-gray-500">Temps restant dans la fenêtre de suivi</p>
                    <p className="mt-2 font-mono text-6xl font-light leading-none tracking-tight text-[#D40030] tabular-nums">
                      {manualVerificationDeadline ? formatTimeRemaining(manualVerificationSecondsLeft) : "—:—"}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-gray-600">
                      {manualVerificationDeadline && manualVerificationSecondsLeft > 0
                        ? "La vérification peut se poursuivre au-delà de ce délai."
                        : "Le délai indicatif est écoulé : votre demande reste en attente et n’a pas été annulée."}
                    </p>
                    {manualVerificationDeadline && manualVerificationSecondsLeft === 0 && (
                      <button
                        type="button"
                        onClick={() => setManualVerificationDeadline(Date.now() + 5 * 60 * 1000)}
                        className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-[11px] border-2 border-[#111827] bg-[#D40030] px-4 py-2 text-sm font-bold text-white shadow-[0_3px_0_#111827] transition hover:bg-[#A60026] active:translate-y-[2px] active:shadow-[0_1px_0_#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D40030] focus-visible:ring-offset-2"
                      >
                        <RefreshCw aria-hidden="true" className="h-4 w-4" /> Continuer le suivi
                      </button>
                    )}
                  </div>
                )}

                <div className="rounded-xl border-2 border-[#111827] bg-white p-4 text-left text-sm leading-6 text-gray-800 shadow-[0_3px_0_#111827]">
                  <div className="flex justify-between gap-4"><b>Opérateur</b><span className="text-right">{operator?.name}</span></div>
                  <div className="mt-2 flex justify-between gap-4"><b>Montant</b><span className="text-right">{amount.toLocaleString()} {currency}</span></div>
                  <div className="mt-2"><b>ID de transaction</b><p className="mt-1 break-all font-mono">{manualTransactionReference.trim()}</p></div>
                  {depositId && <div className="mt-2"><b>Référence de la demande</b><p className="mt-1 font-mono">#{depositId}</p></div>}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => navigate("/deposits-history?from=deposit")}
                    className="flex-1 rounded-[11px] border-2 border-[#111827] bg-white py-3 font-semibold text-[#111827] shadow-[0_3px_0_#111827] transition hover:bg-gray-50 active:translate-y-[2px] active:shadow-[0_1px_0_#111827]"
                  >
                    Voir mes dépôts
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="flex-1 rounded-[11px] border-2 border-[#111827] bg-[#D40030] py-3 font-bold text-white shadow-[0_3px_0_#111827] transition hover:bg-[#A60026] active:translate-y-[2px] active:shadow-[0_1px_0_#111827]"
                  >
                    Retour au site
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5 py-5 text-center">
                <div className={`border-b pb-3 text-left text-xl font-extrabold ${isBjClapayFlow ? "border-[#d7e2f2] text-[#17345b]" : "border-gray-200 text-gray-900"}`}>Paiement — {countryInfo?.name || country}</div>
                <p className={`text-left text-2xl font-bold ${isBjClapayFlow ? "text-[#00377d]" : "text-gray-900"}`}>{amount.toLocaleString("fr-FR")} {currency}</p>
                {activeProvider === "clapay" && clapayConfirmationCode && (
                  <section
                    aria-label="Code de confirmation du dépôt CATL"
                    role="status"
                    className={`rounded-xl border-2 p-4 text-left ${isBjClapayFlow ? "border-[#d7e2f2] bg-[#f2f6fc] shadow-[0_3px_8px_rgba(0,35,82,0.08)]" : "border-[#111827] bg-[#FFF0F3] shadow-[0_3px_0_#111827,0_6px_12px_rgba(17,24,39,0.1)]"}`}
                  >
                    <p className={`text-sm font-bold uppercase tracking-[0.08em] ${isBjClapayFlow ? "text-[#00377d]" : "text-[#A60026]"}`}>
                      Code de confirmation
                    </p>
                    <p className={`mt-2 break-all text-center font-mono text-2xl font-extrabold tracking-[0.12em] ${isBjClapayFlow ? "text-[#17345b]" : "text-[#111827]"}`}>
                      {clapayConfirmationCode}
                    </p>
                    <p className="mt-2 text-sm leading-5 text-gray-700">
                      Utilisez ce code pour terminer la confirmation du paiement auprès de l’opérateur.
                    </p>
                    <button
                      type="button"
                      onClick={copyClapayConfirmationCode}
                      className={`mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-[11px] border-2 px-3 py-2 text-sm font-bold text-white transition active:translate-y-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${isBjClapayFlow ? "border-[#002b61] bg-[#00377d] shadow-[0_2px_8px_rgba(0,35,82,0.12)] hover:bg-[#002b61] focus-visible:ring-[#00377d]" : "border-[#111827] bg-[#D40030] shadow-[0_2px_0_#111827] hover:bg-[#A60026] active:shadow-none focus-visible:ring-[#D40030]"}`}
                    >
                      <Copy aria-hidden="true" className="h-4 w-4" /> Copier le code
                    </button>
                  </section>
                )}
                {isNitaClapayFlow && !clapayConfirmationCode && (
                  <section
                    aria-label="Code de confirmation NITA non reçu"
                    role="status"
                    aria-live="polite"
                    className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-left"
                  >
                    <p className="font-bold text-amber-900">Code de confirmation NITA non reçu</p>
                    <p className="mt-2 text-sm leading-6 text-amber-900">
                      {nitaCodeMessage || "CATL n’a pas reçu le code. Contactez le service client avant de continuer."}
                    </p>
                  </section>
                )}
                <Check className="mx-auto h-24 w-24 rounded-full bg-green-500 p-4 text-white" />
                <h2 className={`text-xl font-bold ${isBjClapayFlow ? "text-[#17345b]" : "text-gray-900"}`}>Votre paiement a été approuvé</h2>
                <div className={`rounded-xl border-2 p-3 text-left text-sm leading-7 text-gray-800 ${isBjClapayFlow ? "border-[#d7e2f2] bg-[#f8fbff]" : "border-[#111827] bg-[#FFF8FA]"}`}>
                  <b>Payeur :</b> {phone}<br />
                  <b>ID Transaction :</b> {transactionReference}<br />
                  <b>Date Paiement :</b> {new Date().toLocaleString("fr-FR")}
                </div>
                <p className="pt-6 text-gray-600">🔒 Paiement vérifié</p>
                <button onClick={() => navigate("/")} className={`text-lg font-semibold underline underline-offset-4 ${isBjClapayFlow ? "text-[#00377d] decoration-[#ffd100] hover:text-[#002b61]" : "text-[#111827] decoration-[#D40030] hover:text-[#A60026]"}`}>Retourner sur le site</button>
              </div>
            )
          )}
        </section>
      </div>
    </main>
  );
}