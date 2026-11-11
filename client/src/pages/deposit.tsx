import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronDown, ChevronLeft, Copy, CheckCircle, Upload, Phone, Loader2,
  ImageIcon, ArrowRight, Zap, RefreshCw, ExternalLink, Check,
} from "lucide-react";
import { Link } from "wouter";
import { CountrySelector } from "@/components/country-selector";
import BottomNav from "@/components/bottom-nav";
import { getCountriesForDisplay, type ApiCountry } from "@/lib/countries";
import { sanitizeDepositDisplayText } from "@/lib/deposit-display";
import { withCoteDIvoireWaveAmount } from "@/lib/wave-payment-link";
import { FRESH_PLATFORM_SETTINGS_QUERY_OPTIONS } from "@/lib/queryClient";
import {
  DEFAULT_MINIMUM_DEPOSIT,
  DEPOSIT_AMOUNT_PRESETS,
  readPositiveIntegerSetting,
} from "@shared/platform-settings";
import type { PaymentNumber } from "@shared/schema";

type DepositMethodId = "manual" | "soleaspay" | "ashtech" | "sendavapay" | "westpay" | "inpay" | "clapay";
type DepositMethodChoice = { provider: DepositMethodId };

const TON_GREEN = "#00317d";
const TON_GREEN_DARK = "#123a78";
const TON_GRADIENT = "linear-gradient(105deg, #0c3a83 0%, #5273a7 100%)";
const SOLEASPAY_PENDING_DEPOSIT_KEY = "soleaspay-pending-deposit";

const DEPOSIT_STEP_STYLES = `
  .deposit-step-shell {
    min-height: 100dvh;
    max-width: 512px;
    margin: 0 auto;
    overflow: hidden;
    background: #f1f1fa;
    color: #202124;
    font-family: Roboto, Arial, sans-serif;
  }
  .deposit-step-shell .deposit-step-header {
    min-height: 72px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
    border-bottom: 0;
    background: #00317d;
    color: #fff;
  }
  .deposit-step-shell .deposit-step-back {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: 42px;
    padding: 8px 12px 8px 8px;
    border: 1px solid rgb(255 255 255 / 42%);
    border-radius: 10px;
    background: #fff;
    color: #00317d;
    font-size: 15px;
    font-weight: 800;
    box-shadow: none;
  }
  .deposit-step-shell .deposit-step-back:active {
    transform: translateY(2px);
    box-shadow: none;
  }
  .deposit-step-shell .deposit-step-history {
    min-height: 40px;
    padding: 8px 12px;
    border: 1px solid rgb(255 255 255 / 42%);
    border-radius: 11px;
    background: rgb(255 255 255 / 12%);
    color: #fff;
    font-size: 12px;
    font-weight: 800;
  }
  .deposit-step-shell .deposit-step-content {
    padding: 16px;
  }
  .deposit-step-shell .deposit-step-summary {
    border: 1px solid #dce2ec;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 2px 7px rgb(25 44 78 / 8%);
  }
  .deposit-step-shell .deposit-step-card {
    border: 1px solid #dce2ec;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 2px 7px rgb(25 44 78 / 8%);
  }
  .deposit-step-shell .deposit-step-card-accent {
    border-color: ${TON_GREEN};
    background: #edf2ff;
  }
  .deposit-step-shell .deposit-step-field {
    border: 1px solid #d4dce9 !important;
    border-radius: 9px !important;
    background: #f1f3f8 !important;
    box-shadow: none;
  }
  .deposit-step-shell .deposit-step-primary {
    min-height: 54px;
    border: 1px solid #092e6b !important;
    border-radius: 999px !important;
    background: ${TON_GRADIENT} !important;
    color: #fff !important;
    font-weight: 800 !important;
    box-shadow: 0 4px 9px rgb(19 49 99 / 22%);
  }
  .deposit-step-shell .deposit-step-primary:active:not(:disabled) {
    transform: translateY(3px);
    box-shadow: 0 2px 5px rgb(19 49 99 / 18%);
  }
  .deposit-step-shell .deposit-step-secondary {
    border: 1px solid #d8dfe9 !important;
    border-radius: 12px !important;
    background: #f3f5f8 !important;
    color: #111827 !important;
    font-weight: 800 !important;
    box-shadow: none;
  }
  .deposit-step-shell .deposit-step-icon {
    display: grid;
    width: 76px;
    height: 76px;
    place-items: center;
    border: 1px solid #dce2ec;
    border-radius: 50%;
    background: #edf2ff;
    box-shadow: 0 2px 5px rgb(25 44 78 / 8%);
  }
  .deposit-step-shell .deposit-step-icon svg {
    color: ${TON_GREEN};
  }
  .deposit-step-shell .deposit-step-operator {
    border: 1px solid #dce2ec !important;
    border-radius: 12px !important;
    background: #fff !important;
    box-shadow: 0 2px 5px rgb(25 44 78 / 8%);
  }
  .deposit-step-shell .deposit-step-operator-selected {
    border-color: ${TON_GREEN} !important;
    background: ${TON_GREEN} !important;
    color: #fff !important;
    box-shadow: 0 3px 8px rgb(25 44 78 / 18%);
  }
  .deposit-step-shell .deposit-step-otp {
    border: 1px solid #d4dce9 !important;
    border-radius: 12px !important;
    background: #f1f3f8 !important;
    box-shadow: none;
  }
  .deposit-step-shell [class*="text-[#D40030]"],
  .deposit-step-shell [class*="text-[#A60026]"],
  .deposit-step-shell [class*="border-[#D40030]"],
  .deposit-step-shell [class*="hover:border-[#D40030]"],
  .deposit-step-shell [class*="focus:border-[#D40030]"] {
    color: #1947b8 !important;
    border-color: #1947b8 !important;
  }
  .deposit-step-shell [class*="bg-[#D40030]"] {
    background-color: #1947b8 !important;
  }
  .deposit-step-shell [class*="bg-[#FFF0F3]"],
  .deposit-step-shell [class*="hover:bg-[#FFF0F3]"] {
    background-color: #edf2ff !important;
  }
  @media (max-width: 360px) {
    .deposit-step-shell .deposit-step-header { padding-right: 12px; padding-left: 12px; }
    .deposit-step-shell .deposit-step-content { padding: 12px; }
    .deposit-step-shell .deposit-step-back { font-size: 14px; }
  }
`;

function DepositStepStyles() {
  return <style>{DEPOSIT_STEP_STYLES}</style>;
}

type Step =
  | "amount"
  | "form"
  | "sv-operator"
  | "sv-waiting"
  | "sv-otp"
  | "sv-redirect"
  | "soleaspay-waiting"
  | "westpay"
  | "ashtech-operator"
  | "ashtech-otp"
  | "ashtech-redirect"
  | "ashtech-waiting";

interface SvOperator {
  id: string;
  name: string;
  requiresOtp: boolean;
  status: string;
}

interface AshtechCountry {
  code: string;
  name: string;
  currency: string;
  operators: (string | { name?: string; code?: string; id?: string })[];
}

export default function DepositPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("amount");
  const [selectedNumber, setSelectedNumber] = useState<PaymentNumber | null>(null);
  const [selectedDepositMethod, setSelectedDepositMethod] = useState<DepositMethodId | "">("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const [amount, setAmount] = useState<number | "">("");
  const [depositCountry, setDepositCountry] = useState("");
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [senderPhone, setSenderPhone] = useState(user?.phone || "");
  const [screenshot, setScreenshot] = useState<string>("");
  const [screenshotName, setScreenshotName] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [reference, setReference] = useState("");

  // SendavaPay state
  const [svCountry, setSvCountry] = useState(user?.country || "");
  const [svPhone, setSvPhone] = useState("");
  const [svOperator, setSvOperator] = useState<SvOperator | null>(null);
  const [svDepositId, setSvDepositId] = useState<number | null>(null);
  const [svPaymentToken, setSvPaymentToken] = useState<string>("");
  const [svOtpToken, setSvOtpToken] = useState<string>("");
  const [svOtp, setSvOtp] = useState<string>("");
  const [svUssdCode, setSvUssdCode] = useState<string>("");
  const [svOtpMessage, setSvOtpMessage] = useState<string>("");
  const [svRedirectUrl, setSvRedirectUrl] = useState<string>("");
  const [svStatus, setSvStatus] = useState<string>("");
  const [svPolling, setSvPolling] = useState(false);

  // SoleaPay state
  const [soleaspayDepositId, setSoleaspayDepositId] = useState<number | null>(null);
  const [soleaspayStatus, setSoleaspayStatus] = useState("");
  const [soleaspayMessage, setSoleaspayMessage] = useState("");
  const [soleaspayPolling, setSoleaspayPolling] = useState(false);

  // AshtechPay state
  const [ashtechCountry, setAshtechCountry] = useState(user?.country || "");
  const [ashtechPhone, setAshtechPhone] = useState("");
  const [ashtechOperator, setAshtechOperator] = useState("");
  const [ashtechDepositId, setAshtechDepositId] = useState<number | null>(null);
  const [ashtechOtp, setAshtechOtp] = useState("");
  const [ashtechUssdCode, setAshtechUssdCode] = useState("");
  const [ashtechMessage, setAshtechMessage] = useState("");
  const [ashtechWaveUrl, setAshtechWaveUrl] = useState("");
  const [ashtechStatus, setAshtechStatus] = useState("");
  const [ashtechPolling, setAshtechPolling] = useState(false);

  const country = depositCountry;

  const { data: loadedCountries, isError: countriesError } = useQuery<ApiCountry[]>({
    queryKey: ["/api/countries"],
  });
  const apiCountries = getCountriesForDisplay(loadedCountries, countriesError);

  const countryInfo = apiCountries.find(c => c.code === country && c.isActive);
  const currency = countryInfo?.currency || "FCFA";

  const { data: platformSettings, isFetching: settingsRefreshing } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
    ...FRESH_PLATFORM_SETTINGS_QUERY_OPTIONS,
  });
  const { data: depositMethodsData, isLoading: depositMethodsLoading, isError: depositMethodsError } =
    useQuery<{ country: string; methods: DepositMethodChoice[] }>({
      queryKey: ["/api/deposit/methods", country],
      queryFn: async () => {
        const response = await fetch(`/api/deposit/methods/${encodeURIComponent(country)}`, {
          credentials: "include",
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Impossible de charger les moyens de dépôt");
        return result;
      },
      enabled: !!country,
    });
  const depositMethods = depositMethodsData?.methods || [];
  const depositMethodIds = new Set(depositMethods.map((method) => method.provider));
  const depositMethodSignature = depositMethods.map((method) => method.provider).join(",");
  useEffect(() => {
    if (depositMethods.length === 1) {
      setSelectedDepositMethod(depositMethods[0].provider);
    } else {
      setSelectedDepositMethod("");
    }
  }, [country, depositMethodSignature]);
  const MIN_DEPOSIT = readPositiveIntegerSetting(
    platformSettings?.minDeposit,
    DEFAULT_MINIMUM_DEPOSIT,
  );
  const depositPresets = DEPOSIT_AMOUNT_PRESETS;
  const ashtechAvailable = depositMethodIds.has("ashtech");

  const depositCountryPriority: Record<string, number> = { CI: 0, NE: 1 };
  const activeDepositCountries = apiCountries
    .filter(c => c.isActive)
    .sort((first, second) =>
      (depositCountryPriority[first.code.toUpperCase()] ?? 2) -
      (depositCountryPriority[second.code.toUpperCase()] ?? 2),
    ) as Array<{ code: string; name: string; currency: string }>;
  useEffect(() => {
    if (depositCountry) return;
    const preferredCountryCode = String(user?.country || "").toUpperCase();
    const preferredCountry = activeDepositCountries.find(
      item => item.code.toUpperCase() === preferredCountryCode,
    );
    if (preferredCountry) setDepositCountry(preferredCountry.code);
  }, [depositCountry, loadedCountries, countriesError, user?.country]);
  const ashtechConfiguredCountryCodes = ashtechAvailable ? [country.toUpperCase()] : [];

  const { data: paymentNumbersList = [], isLoading: numbersLoading } = useQuery<PaymentNumber[]>({
    queryKey: ["/api/payment-numbers", country],
    queryFn: async () => {
      const res = await fetch(`/api/payment-numbers?country=${country}`, { credentials: "include" });
       if (!res.ok) throw new Error("Impossible de charger les numéros de paiement");
      return res.json();
    },
    enabled: !!country,
  });

  // SendavaPay: load operators for selected country
  const { data: svOperatorsData, isLoading: svOperatorsLoading } = useQuery<{ success: boolean; data: SvOperator[] }>({
    queryKey: ["/api/sendavapay/operators", svCountry],
    queryFn: async () => {
      const res = await fetch(`/api/sendavapay/operators/${svCountry}`, { credentials: "include" });
       if (!res.ok) throw new Error("Impossible de charger les opérateurs SendavaPay");
      return res.json();
    },
    enabled: step === "sv-operator" && !!svCountry,
  });
  const svOperators = (svOperatorsData?.data || []).filter(op => op.status === "online");

  const { data: ashtechCountries = [], isLoading: ashtechCountriesLoading } = useQuery<AshtechCountry[]>({
    queryKey: ["/api/ashtechpay/countries"],
    queryFn: async () => {
      const res = await fetch("/api/ashtechpay/countries", { credentials: "include" });
      if (!res.ok) throw new Error("Impossible de charger les opérateurs");
      return res.json();
    },
    enabled: step === "ashtech-operator" && ashtechAvailable,
  });
  const { data: ashtechOperatorData } = useQuery<{ country: string; operators: AshtechCountry["operators"] }>({
    queryKey: ["/api/ashtechpay/operators", ashtechCountry],
    queryFn: async () => {
      const res = await fetch(`/api/ashtechpay/operators/${encodeURIComponent(ashtechCountry)}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Impossible de charger les opérateurs");
      return data;
    },
    enabled: step === "ashtech-operator" && ashtechAvailable && !!ashtechCountry,
  });
  const availableAshtechCountries = ashtechCountries.filter(c =>
    activeDepositCountries.some(active => active.code.toUpperCase() === c.code.toUpperCase()) &&
    ashtechConfiguredCountryCodes.includes(c.code.toUpperCase())
  );
  const ashtechOperators = ashtechOperatorData?.operators || [];

  // Poll deposit status
  useEffect(() => {
    if (step !== "sv-waiting" || !svDepositId || !svPolling) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/deposits/${svDepositId}/sendavapay-status`, { credentials: "include" });
        const data = await res.json();
        setSvStatus(data.status);
        if (data.status === "approved") {
          clearInterval(interval);
          setSvPolling(false);
          toast({ title: "Paiement confirmé !", description: "Votre solde a été crédité." });
          refreshUser();
          queryClient.invalidateQueries({ queryKey: ["/api/deposits/history"] });
          // reset
          setStep("amount");
          setAmount("");
          setSvOperator(null);
          setSvDepositId(null);
          setSvPaymentToken("");
          setSvOtpToken("");
          setSvOtp("");
          setSvStatus("");
        } else if (data.status === "rejected") {
          clearInterval(interval);
          setSvPolling(false);
          toast({ title: "Paiement échoué", description: "Le paiement a été refusé ou annulé.", variant: "destructive" });
          setStep("sv-operator");
        }
      } catch (e) {
        // ignore polling errors
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [step, svDepositId, svPolling]);

  useEffect(() => {
    if (step !== "ashtech-waiting" || !ashtechDepositId || !ashtechPolling) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/deposits/${ashtechDepositId}/ashtechpay-status`, { credentials: "include" });
        const data = await res.json();
        setAshtechStatus(data.status);
        if (data.status === "approved") {
          clearInterval(interval);
          setAshtechPolling(false);
          toast({ title: "Paiement confirmé !", description: "Votre solde a été crédité." });
          refreshUser();
          queryClient.invalidateQueries({ queryKey: ["/api/deposits/history"] });
          setStep("amount");
          setAmount("");
          setAshtechDepositId(null);
          setAshtechStatus("");
        } else if (data.status === "rejected") {
          clearInterval(interval);
          setAshtechPolling(false);
          toast({ title: "Paiement échoué", description: "Le paiement a été refusé ou annulé.", variant: "destructive" });
          setStep("ashtech-operator");
        }
      } catch {
        // Keep polling; a transient provider error must not lose the payment flow.
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [step, ashtechDepositId, ashtechPolling]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returnStatus = params.get("soleaspayReturn");
    if (returnStatus !== "success" && returnStatus !== "failure") return;

    const returnedOrderId = params.get("orderId");
    let resumed = false;
    try {
      const pendingValue = sessionStorage.getItem(SOLEASPAY_PENDING_DEPOSIT_KEY);
      const pending = pendingValue ? JSON.parse(pendingValue) : null;
      const pendingDepositId = Number(pending?.depositId);
      const pendingOrderId = typeof pending?.orderId === "string" ? pending.orderId : "";
      if (
        Number.isInteger(pendingDepositId) &&
        pendingDepositId > 0 &&
        (!returnedOrderId || pendingOrderId === returnedOrderId)
      ) {
        setSoleaspayDepositId(pendingDepositId);
        setSoleaspayStatus("pending");
        setSoleaspayMessage(
          returnStatus === "success"
            ? "Retour du paiement reçu. Vérification en cours..."
            : "Retour du paiement reçu. Vérification de l'état final...",
        );
        setSoleaspayPolling(true);
        setStep("soleaspay-waiting");
        resumed = true;
      }
    } catch (error) {
      console.warn("[soleaspay] Could not resume pending deposit:", error);
    }

    if (!resumed) {
      toast({
        title: "Retour du paiement reçu",
        description: "Consultez l'historique des dépôts pour vérifier le statut du paiement.",
      });
    }

    params.delete("soleaspayReturn");
    params.delete("orderId");
    const search = params.toString();
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`,
    );
  }, [toast]);

  useEffect(() => {
    if (step !== "soleaspay-waiting" || !soleaspayDepositId || !soleaspayPolling) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/deposits/${soleaspayDepositId}/verify`, { credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Vérification SoleaPay impossible");
        if (data.status) setSoleaspayStatus(data.status);
        if (data.status === "approved" || data.status === "rejected") {
          clearInterval(interval);
          setSoleaspayPolling(false);
          try {
            sessionStorage.removeItem(SOLEASPAY_PENDING_DEPOSIT_KEY);
          } catch {
            // The server-side payment status remains authoritative.
          }
          if (data.status === "approved") {
            toast({ title: "Paiement confirmé !", description: "Votre solde a été crédité." });
            refreshUser();
            queryClient.invalidateQueries({ queryKey: ["/api/deposits/history"] });
          }
        }
      } catch {
        // Continue polling after transient provider or network errors.
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [step, soleaspayDepositId, soleaspayPolling]);

  // ── Mutations ───────────────────────────────────────────────────────────────

  const copyPhone = async (number: PaymentNumber) => {
    const value = number.paymentLink || number.phone || "";
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(number.id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({ title: number.paymentLink ? "Lien copié !" : "Numéro copié !", description: `${value} copié` });
    } catch {
      toast({ title: number.paymentLink || "Numéro: " + number.phone, description: number.paymentLink ? "Ouvrez le lien pour payer" : "Copiez ce numéro manuellement" });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Fichier trop grand", description: "Maximum 5 Mo", variant: "destructive" });
      return;
    }
    setScreenshotName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setScreenshot(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const depositMutation = useMutation({
    mutationFn: async () => {
      if (!selectedNumber) throw new Error("Aucun numéro sélectionné");
      const res = await apiRequest("POST", "/api/deposits", {
        amount: Number(amount),
        accountName: user?.fullName || "",
        accountNumber: senderPhone,
        paymentMethod: selectedNumber.operatorName,
        country,
        paymentNumberId: selectedNumber.id,
        channelName: selectedNumber.paymentLink
          ? `${selectedNumber.operatorName} - Lien de paiement`
          : `${selectedNumber.operatorName} - ${selectedNumber.phone}`,
        screenshot: screenshot || null,
        paymentMessage: paymentMessage || null,
        reference: reference || null,
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Dépôt non enregistré");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Demande envoyée !", description: "Votre dépôt est en attente de validation" });
      queryClient.invalidateQueries({ queryKey: ["/api/deposits/history"] });
      refreshUser();
      setStep("amount");
      setSelectedNumber(null);
      setAmount("");
      setSenderPhone(user?.phone || "");
      setScreenshot("");
      setScreenshotName("");
      setPaymentMessage("");
      setReference("");
    },
    onError: (e: any) => toast({ title: "Dépôt non enregistré", description: sanitizeDepositDisplayText(e.message, "Impossible d’enregistrer le dépôt."), variant: "destructive" }),
  });

  // WestPay: create deposit + get redirect URL
  const [wpDepositId, setWpDepositId] = useState<number | null>(null);
  const [wpStatus, setWpStatus] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("wp_status");
    const did = params.get("wp_depositId");
    if (s) {
      setWpStatus(s);
      if (did) setWpDepositId(parseInt(did));
      // clean URL
      window.history.replaceState({}, "", "/deposit");
      if (s === "success") {
        toast({ title: "Paiement en cours de confirmation", description: "Votre dépôt sera crédité dès confirmation." });
        queryClient.invalidateQueries({ queryKey: ["/api/deposits/history"] });
      }
    }
  }, []);

  const wpInitiateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/deposits", {
        amount: Number(amount),
        accountName: user?.fullName || "",
        accountNumber: user?.phone || "",
        paymentMethod: "WestPay",
        country,
        useWestpay: true,
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Dépôt non enregistré");
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.westpayUrl) {
        window.location.href = data.westpayUrl;
      }
    },
    onError: (e: any) => toast({ title: "Dépôt non enregistré", description: sanitizeDepositDisplayText(e.message, "Impossible d’enregistrer le dépôt."), variant: "destructive" }),
  });

  const inpayInitiateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/deposits", {
        amount: Number(amount),
        accountName: user?.fullName || "",
        accountNumber: user?.phone || "",
        paymentMethod: "InPay",
        country,
        useInpay: true,
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Dépôt non enregistré");
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.inpayUrl) {
        window.location.href = data.inpayUrl;
      }
    },
    onError: (e: any) => toast({ title: "Dépôt non enregistré", description: sanitizeDepositDisplayText(e.message, "Impossible d’enregistrer le dépôt."), variant: "destructive" }),
  });

  const ashtechCollectMutation = useMutation({
    mutationFn: async (otp?: string) => {
      if (!ashtechOperator || !ashtechPhone.trim()) throw new Error("Sélectionnez un opérateur et saisissez votre numéro");
      const res = await apiRequest("POST", "/api/ashtechpay/collect", {
        amount: Number(amount),
        country: ashtechCountry,
        operator: ashtechOperator,
        phone: ashtechPhone.trim(),
        depositId: ashtechDepositId || undefined,
        otp: otp || undefined,
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Dépôt non enregistré");
      }
      return res.json();
    },
    onSuccess: (data: any) => {
      setAshtechDepositId(data.depositId);
      setAshtechMessage(sanitizeDepositDisplayText(data.message, ""));
      setAshtechUssdCode(data.ussdCode || "");
      if (data.waveUrl) {
        setAshtechWaveUrl(data.waveUrl);
        setStep("ashtech-redirect");
      } else if (data.requiresOtp) {
        setStep("ashtech-otp");
      } else {
        setAshtechPolling(true);
        setAshtechStatus(data.status || "pending");
        setStep("ashtech-waiting");
      }
    },
    onError: (e: any) => {
      if (e.data?.requiresOtp) {
        setAshtechDepositId(e.data.depositId || ashtechDepositId);
        setAshtechUssdCode(e.data.ussdCode || "");
        setAshtechMessage(sanitizeDepositDisplayText(e.message, "Composez le code indiqué puis saisissez le code OTP."));
        setAshtechOtp("");
        setStep("ashtech-otp");
        return;
      }
      toast({ title: "Dépôt non enregistré", description: sanitizeDepositDisplayText(e.message, "Impossible d’enregistrer le dépôt."), variant: "destructive" });
    },
  });

  // SendavaPay: create + initiate
  const svInitiateMutation = useMutation({
    mutationFn: async () => {
      if (!svOperator) throw new Error("Sélectionnez un opérateur");
      // Step 1: create payment on backend
      const createRes = await apiRequest("POST", "/api/sendavapay/create", {
        amount: Number(amount),
        country: svCountry,
        operatorId: svOperator.id,
        operatorName: svOperator.name,
        payerPhone: svPhone,
      });
      if (!createRes.ok) {
        const d = await createRes.json();
        throw new Error(d.message || "Création du paiement impossible");
      }
      const createData = await createRes.json();
      setSvDepositId(createData.depositId);
      setSvPaymentToken(createData.paymentToken);

      // Step 2: initiate payment
      const initRes = await apiRequest("POST", "/api/sendavapay/initiate", {
        paymentToken: createData.paymentToken,
        payerCountry: svCountry,
        operatorId: svOperator.id,
        depositId: createData.depositId,
        payerPhone: svPhone,
      });
      if (!initRes.ok) {
        const d = await initRes.json();
        throw new Error(d.message || "Initiation du paiement impossible");
      }
      return initRes.json();
    },
    onSuccess: (data: any) => {
      const isWave = svOperator?.name?.toLowerCase().includes("wave");
      if (data.requiresRedirect && data.redirectUrl && isWave) {
        // Seul Wave nécessite une redirection vers une page externe
        setSvRedirectUrl(data.redirectUrl);
        setStep("sv-redirect");
      } else if (data.requiresRedirect && !isWave) {
        // Les autres opérateurs (MTN, Moov, etc.) envoient un push USSD directement
        // sur le téléphone — pas besoin de redirection, on attend juste le webhook
        setSvPolling(true);
        setStep("sv-waiting");
      } else if (data.requiresOtp && data.otpToken) {
        // Orange Money (BF, CI, GN, ML, SN) — user must dial USSD then enter OTP
        setSvOtpToken(data.otpToken);
        setSvUssdCode(data.ussdCode || "");
        setSvOtpMessage(sanitizeDepositDisplayText(data.message, ""));
        setStep("sv-otp");
      } else if (data.success) {
        // Standard push: invite sent directly to phone — wait for webhook
        setSvPolling(true);
        setStep("sv-waiting");
      } else {
        toast({ title: "Paiement impossible", description: sanitizeDepositDisplayText(data.error || data.message, "Le paiement n'a pas pu être initié."), variant: "destructive" });
      }
    },
    onError: (e: any) => toast({ title: "Paiement impossible", description: sanitizeDepositDisplayText(e.message, "Le paiement n'a pas pu être initié."), variant: "destructive" }),
  });

  // SendavaPay: retry failed payment
  const svRetryMutation = useMutation({
    mutationFn: async () => {
      if (!svPaymentToken) throw new Error("Token de paiement manquant");
      const res = await apiRequest("POST", "/api/sendavapay/retry", {
        paymentToken: svPaymentToken,
        depositId: svDepositId,
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Nouvelle tentative impossible");
      }
      return res.json();
    },
    onSuccess: () => {
      // Reset to operator selection to re-initiate
      setSvOtp("");
      setSvOtpToken("");
      setSvStatus("");
      setSvPolling(false);
      setStep("sv-operator");
      toast({ title: "Prêt à réessayer", description: "Sélectionnez un opérateur et relancez le paiement." });
    },
    onError: (e: any) => toast({ title: "Nouvelle tentative impossible", description: sanitizeDepositDisplayText(e.message, "Réessayez dans quelques instants."), variant: "destructive" }),
  });

  // SendavaPay: submit OTP
  const svOtpMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/sendavapay/submit-otp", {
        otpToken: svOtpToken,
        otp: svOtp,
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Validation du code OTP impossible");
      }
      return res.json();
    },
    onSuccess: () => {
      setSvPolling(true);
      setStep("sv-waiting");
    },
    onError: (e: any) => toast({ title: "Validation du code OTP impossible", description: sanitizeDepositDisplayText(e.message, "Vérifiez le code puis réessayez."), variant: "destructive" }),
  });

  const handleAmountNext = () => {
    if (!amount || Number(amount) < MIN_DEPOSIT) {
      toast({
        title: "Montant invalide",
        description: `Le minimum est de ${MIN_DEPOSIT.toLocaleString()} ${currency}`,
        variant: "destructive",
      });
      return;
    }
    if (
      selectedDepositMethod === "inpay" &&
      (!Number.isInteger(Number(amount)) || Number(amount) % 5 !== 0)
    ) {
      toast({
        title: "Montant invalide",
        description: "Utilisez un montant entier multiple de 5 : 300, 305, 310…",
        variant: "destructive",
      });
      return;
    }

    openRobotPay();
  };

  const openRobotPay = () => {
    if (!depositCountry) {
      toast({ title: "Pays requis", description: "Sélectionnez le pays du paiement.", variant: "destructive" });
      return;
    }
    if (!selectedDepositMethod || !depositMethodIds.has(selectedDepositMethod)) {
      toast({
        title: "Moyen de dépôt requis",
        description: depositMethodsLoading
          ? "Chargement des moyens disponibles..."
          : "Aucun moyen de dépôt n’est configuré pour ce pays.",
        variant: "destructive",
      });
      return;
    }
    if (
      selectedDepositMethod === "soleaspay" ||
      selectedDepositMethod === "ashtech" ||
      selectedDepositMethod === "sendavapay" ||
      selectedDepositMethod === "manual" ||
      selectedDepositMethod === "clapay"
    ) {
      window.location.href =
        `/robotpay?amount=${encodeURIComponent(Number(amount))}` +
        `&country=${encodeURIComponent(depositCountry)}` +
        `&provider=${encodeURIComponent(selectedDepositMethod)}`;
      return;
    }
    if (selectedDepositMethod === "inpay") {
      if (!Number.isInteger(Number(amount)) || Number(amount) % 5 !== 0) {
        toast({
          title: "Montant invalide",
          description: "Utilisez un montant entier multiple de 5 : 300, 305, 310…",
          variant: "destructive",
        });
        return;
      }
      inpayInitiateMutation.mutate();
      return;
    }
    if (selectedDepositMethod === "westpay") {
      wpInitiateMutation.mutate();
      return;
    }
  };

  const getOperatorIcon = (name: string): string | null => {
    const n = name.toLowerCase();
    if (n.includes("tmoney") || n.includes("t-money")) return "/operators/tmoney.png";
    if (n.includes("moov")) return country.toUpperCase() === "TG" ? "/operators/moov-money-togo.webp" : "/operators/moov.jpg";
    if (n.includes("orange")) return "/operators/orange.png";
    if (n.includes("mtn")) return "/operators/mtn.png";
    if (n.includes("airtel")) return "/operators/airtel.png";
    if (n.includes("wave")) return "/operators/wave.png";
    return null;
  };

  const handleSubmit = () => {
    if (!senderPhone.trim()) {
      toast({ title: "Numéro requis", description: "Entrez le numéro depuis lequel vous avez payé", variant: "destructive" });
      return;
    }
    if (!screenshot) {
      toast({ title: "Capture requise", description: "Veuillez joindre la capture d'écran du paiement", variant: "destructive" });
      return;
    }
    depositMutation.mutate();
  };

  if (!user) return null;
  const parsedBalance = Number.parseFloat(user.depositBalance || "0");
  const accountBalance = Math.round(Number.isFinite(parsedBalance) ? parsedBalance : 0);

  // ── STEP 1: Amount ─────────────────────────────────────────────────────────
  if (step === "amount") return (
    <main className="recharge-reference min-h-screen bg-white">
      <style>{`
        .recharge-reference {
          min-height: 100dvh;
          background: #fff;
          color: #111827;
          font-family: Inter, Arial, sans-serif;
        }
        .recharge-reference .recharge-screen {
          width: 100%;
          max-width: 512px;
          min-height: 100dvh;
          margin: 0 auto;
          overflow: hidden;
          background: #fff;
        }
        .recharge-reference .recharge-hero {
          position: relative;
          display: flex;
          box-sizing: border-box;
          height: 64px;
          align-items: center;
          justify-content: center;
          padding: 0 58px;
          background: #fff;
          border-bottom: 1px solid #e5e7eb;
        }
        .recharge-reference .recharge-title {
          margin: 0;
          color: #111827;
          font-size: 20px;
          font-weight: 800;
          line-height: 1.2;
        }
        .recharge-reference .recharge-back {
          position: absolute;
          z-index: 3;
          top: 10px;
          display: grid;
          width: 42px;
          height: 42px;
          place-items: center;
          border: 1.5px solid #eab1be;
          border-radius: 12px;
          padding: 0;
          background: #edf2ff;
          color: ${TON_GREEN_DARK};
          box-shadow: 0 2px 0 #f2c2cc;
        }
        .recharge-reference .recharge-back {
          left: 16px;
        }
        .recharge-reference .recharge-back:active {
          transform: translateY(1px);
          color: ${TON_GREEN_DARK};
          background: #ffe4ea;
          box-shadow: 0 1px 0 #f2c2cc;
        }
        .recharge-reference .account-summary {
          display: flex;
          min-height: 132px;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 20px 18px;
          border-bottom: 1px solid #e5e7eb;
          background: #fff;
        }
        .recharge-reference .balance-value {
          margin: 0;
          color: #111827;
          font-size: 28px;
          font-weight: 800;
          line-height: 1.1;
        }
        .recharge-reference .balance-label {
          margin: 8px 0 0;
          color: #6b7280;
          font-size: 14px;
        }
        .recharge-reference .country-chip {
          display: flex;
          max-width: 54%;
          min-height: 42px;
          align-items: center;
          gap: 8px;
          padding: 0 13px;
          border: 1px solid #e5e7eb;
          border-radius: 999px;
          background: #f6f8ff;
          color: #111827;
          font-size: 13px;
          font-weight: 700;
        }
        .recharge-reference .country-chip-icon {
          flex: 0 0 auto;
          box-sizing: content-box;
          width: 20px;
          height: 20px;
          padding: 5px;
          border-radius: 50%;
          background: #ffe4ea;
          color: ${TON_GREEN};
        }
        .recharge-reference .country-chip-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .recharge-reference .amount-panel {
          padding: 32px 18px 18px;
          background: #fff;
        }
        .recharge-reference .preset-row {
          display: flex;
          overflow-x: auto;
          gap: 8px;
          margin-top: 10px;
          overscroll-behavior-x: contain;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }
        .recharge-reference .preset-row::-webkit-scrollbar {
          display: none;
        }
        .recharge-reference .preset {
          min-width: 82px;
          min-height: 42px;
          flex: 0 0 82px;
          border: 1.5px solid #111827;
          border-radius: 999px;
          background: #f9fafb;
          color: #24252a;
          font-size: 14px;
          font-weight: 800;
        }
        .recharge-reference .preset.active {
          background: ${TON_GRADIENT};
          border-color: #111827;
          color: #fff;
          box-shadow: 0 3px 0 #111827;
        }
        .recharge-reference .preset:disabled {
          cursor: not-allowed;
          opacity: 0.55;
          box-shadow: 0 2px 0 #17191c, 0 4px 9px rgba(17, 24, 39, .08);
        }
        .recharge-reference .amount-label {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 4px 8px;
          margin: 0 0 10px;
          color: #111827;
          font-size: 16px;
          font-weight: 800;
        }
        .recharge-reference .amount-input {
          display: flex;
          height: 60px;
          align-items: center;
          overflow: hidden;
          border: 2px solid #111827;
          border-radius: 12px;
          background: #fff;
        }
        .recharge-reference .amount-input input {
          width: 100%;
          flex: 1;
          height: 100%;
          min-width: 0;
          padding: 0 14px;
          border: 0;
          outline: 0;
          color: #111827;
          background: transparent;
          font-size: 19px;
        }
        .recharge-reference .currency {
          flex: 0 0 auto;
          padding: 0 13px;
          border-right: 1px solid #e5e7eb;
          color: #111827;
          font-size: 18px;
          font-weight: 800;
        }
        .recharge-reference .country-panel {
          margin: 15px 18px 0;
        }
        .recharge-reference .country-heading {
          display: block;
          margin: 0 0 10px;
          color: #111827;
          font-size: 16px;
          font-weight: 800;
        }
        .recharge-reference .continue {
          display: flex;
          width: calc(100% - 36px);
          min-height: 57px;
          align-items: center;
          justify-content: center;
          margin: 24px 18px 0;
          border: 2px solid #111827;
          border-radius: 12px;
          background: ${TON_GRADIENT};
          color: #fff;
          font-size: 16px;
          font-weight: 800;
          box-shadow: 0 4px 0 #111827;
        }
        .recharge-reference .continue:active:not(:disabled) {
          transform: translateY(3px);
          box-shadow: 0 1px 0 #111827;
        }
        .recharge-reference .continue:disabled {
          opacity: .55;
        }
        .recharge-reference .instructions {
          margin: 18px 18px 24px;
          padding: 22px 16px 10px;
          border: 2px solid #111827;
          border-top: 5px solid ${TON_GREEN};
          border-radius: 14px;
          background: #fff;
          color: #4b5563;
        }
        .recharge-reference .instructions-title {
          margin: 0 0 20px;
          color: #111827;
          font-size: 19px;
          font-weight: 800;
        }
        .recharge-reference .instructions-title::before {
          content: "•";
          margin-right: 8px;
          color: ${TON_GREEN};
          font-size: 24px;
          line-height: 0;
        }
        .recharge-reference .instruction {
          position: relative;
          margin: 0 0 16px 20px;
          font-size: 15px;
          font-weight: 500;
          line-height: 1.65;
        }
        .recharge-reference .instruction::before {
          position: absolute;
          top: 7px;
          left: -15px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          content: "";
          background: ${TON_GREEN};
        }
        .recharge-reference .instruction strong { color: #111827; font-weight: 800; }
        @media (max-width: 360px) {
          .recharge-reference .recharge-back { left: 12px; }
          .recharge-reference .account-summary { padding-right: 12px; padding-left: 12px; }
          .recharge-reference .balance-value { font-size: 24px; }
          .recharge-reference .country-chip { padding: 0 9px; font-size: 12px; }
          .recharge-reference .amount-panel { padding-right: 12px; padding-left: 12px; }
          .recharge-reference .country-panel { margin-right: 12px; margin-left: 12px; }
          .recharge-reference .continue { width: calc(100% - 24px); margin-right: 12px; margin-left: 12px; }
          .recharge-reference .preset { font-size: 12px; }
          .recharge-reference .instruction { font-size: 15px; }
        }
        .recharge-reference {
          background: #f1f1fa;
          color: #202124;
          font-family: Roboto, Arial, sans-serif;
        }
        .recharge-reference .recharge-screen {
          max-width: 512px;
          padding-bottom: max(18px, env(safe-area-inset-bottom));
          background: #f1f1fa;
        }
        .recharge-reference .recharge-hero {
          height: 64px;
          background: #00317d;
          border: 0;
          color: #fff;
        }
        .recharge-reference .recharge-title { color: #fff; font-size: 19px; font-weight: 750; }
        .recharge-reference .recharge-back {
          top: 11px;
          width: 40px;
          height: 40px;
          border: 0;
          border-radius: 50%;
          background: rgb(255 255 255 / 13%);
          color: #fff;
          box-shadow: none;
        }
        .recharge-reference .recharge-back:active {
          background: rgb(255 255 255 / 22%);
          color: #fff;
          box-shadow: none;
        }
        .recharge-reference .deposit-intro {
          position: relative;
          display: flex;
          min-height: 118px;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin: 18px 18px 0;
          padding: 23px 19px 35px;
          overflow: hidden;
          border: 1px solid #0b3475;
          border-radius: 22px 22px 12px 12px;
          background: ${TON_GRADIENT};
          color: #fff;
          box-shadow: 0 4px 11px rgb(13 48 104 / 16%);
        }
        .recharge-reference .deposit-intro-copy {
          position: relative;
          z-index: 1;
          margin: 0;
          max-width: 270px;
          font-size: 16px;
          font-weight: 700;
          line-height: 1.45;
        }
        .recharge-reference .deposit-intro-icon {
          flex: 0 0 auto;
          width: 42px;
          height: 42px;
          margin-top: 1px;
          color: #dce7ff;
          opacity: .92;
        }
        .recharge-reference .account-summary {
          position: relative;
          z-index: 2;
          min-height: 106px;
          justify-content: center;
          margin: -7px 18px 0;
          padding: 18px 16px;
          border: 1px solid #e0e5ed;
          border-radius: 24px;
          background: #fff;
          box-shadow: 0 2px 8px rgb(25 44 78 / 8%);
          text-align: center;
        }
        .recharge-reference .balance-value {
          display: inline;
          color: #00317d;
          font-size: 23px;
          font-weight: 800;
          letter-spacing: -.03em;
        }
        .recharge-reference .balance-label {
          display: inline;
          margin: 0 7px 0 0;
          color: #777b83;
          font-size: 16px;
        }
        .recharge-reference .country-chip { display: none; }
        .recharge-reference .amount-panel {
          margin: 22px 18px 0;
          padding: 17px 16px 16px;
          border: 1px solid #e0e5ed;
          border-radius: 18px;
          background: #fff;
          box-shadow: 0 2px 8px rgb(25 44 78 / 8%);
        }
        .recharge-reference .amount-label {
          display: flex;
          align-items: center;
          margin: 0 0 12px;
          padding-bottom: 11px;
          border-bottom: 1px solid #e8e8e6;
          color: #252a32;
          font-size: 16px;
          font-weight: 750;
        }
        .recharge-reference .amount-heading-icon { flex: none; width: 20px; height: 20px; margin-right: 9px; color: #1947b8; }
        .recharge-reference .preset-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 7px;
          margin: 0 0 10px;
          overflow: visible;
        }
        .recharge-reference .preset {
          min-width: 0;
          min-height: 48px;
          border: 1px solid #e0e5ed;
          border-radius: 10px;
          background: #f7f8fb;
          color: #30343b;
          font-size: 15px;
          font-weight: 700;
          box-shadow: none;
          transition: transform .16s ease, box-shadow .16s ease, background-color .16s ease;
        }
        .recharge-reference .preset.active {
          border-color: #0b3475;
          background: ${TON_GRADIENT};
          color: #fff;
          box-shadow: 0 4px 9px rgb(13 48 104 / 20%);
        }
        .recharge-reference .preset:hover:not(:disabled) { transform: translateY(-1px); }
        .recharge-reference .preset:active:not(:disabled) { transform: translateY(1px); box-shadow: 0 2px 5px rgb(13 48 104 / 16%); }
        .recharge-reference .amount-input {
          height: 52px;
          border: 1px solid #d6deea;
          border-radius: 10px;
          background: #f1f3f8;
          box-shadow: none;
        }
        .recharge-reference .amount-input:focus-within {
          border-color: #00317d;
          box-shadow: none;
        }
        .recharge-reference .amount-input input { font-size: 16px; }
        .recharge-reference .currency {
          padding: 0 13px;
          border: 0;
          color: #00317d;
          font-size: 15px;
          font-weight: 700;
        }
        .recharge-reference .country-panel {
          margin: 16px 18px 0;
          padding: 16px;
          border: 1px solid #e0e5ed;
          border-radius: 17px;
          background: #fff;
          box-shadow: 0 2px 8px rgb(25 44 78 / 8%);
        }
        .recharge-reference .country-heading {
          margin: 0 0 10px;
          color: #292e37;
          font-size: 15px;
          font-weight: 750;
        }
        .recharge-reference .country-options {
          display: block;
        }
        .recharge-reference .country-select {
          display: flex;
          width: 100%;
          min-height: 52px;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 0 14px;
          border: 1px solid #d6deea;
          border-radius: 10px;
          outline: 0;
          background: #f1f3f8;
          color: #454a53;
          font: inherit;
          font-size: 15px;
          text-align: left;
          cursor: pointer;
          box-shadow: none;
          transition: transform .16s ease, border-color .16s ease, box-shadow .16s ease, background-color .16s ease;
        }
        .recharge-reference .country-select:focus-visible {
          border-color: #00317d;
          outline: 0;
          box-shadow: none;
        }
        .recharge-reference .country-select:hover { background: #e9eef7; }
        .recharge-reference .country-select-prefix {
          margin-left: auto;
          color: #00317d;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
        }
        .recharge-reference .country-select svg { flex: none; color: #6b7280; }
        .recharge-reference .continue {
          width: calc(100% - 36px);
          min-height: 58px;
          margin: 17px 18px 0;
          border: 1px solid #0b3475;
          border-radius: 14px;
          background: ${TON_GRADIENT};
          color: #fff;
          font-size: 16px;
          font-weight: 800;
          box-shadow: 0 4px 10px rgb(13 48 104 / 22%);
          transition: transform .16s ease, box-shadow .16s ease;
        }
        .recharge-reference .continue:active:not(:disabled) {
          transform: translateY(3px);
          box-shadow: 0 2px 5px rgb(13 48 104 / 18%);
        }
        .recharge-reference .continue:disabled { opacity: .5; }
        .recharge-reference .instructions {
          margin: 17px 18px 20px;
          padding: 16px 15px 5px;
          border: 1px solid #e0e5ed;
          border-top: 4px solid #00317d;
          border-radius: 17px;
          background: #fff;
          color: #444a54;
          box-shadow: 0 2px 8px rgb(25 44 78 / 8%);
        }
        .recharge-reference .instructions-title {
          margin: 0 0 12px;
          font-size: 16px;
          font-weight: 800;
        }
        .recharge-reference .instructions-title::before {
          content: "!";
          display: inline-grid;
          width: 19px;
          height: 19px;
          place-items: center;
          margin-right: 8px;
          border-radius: 50%;
          background: #00317d;
          color: #fff;
          font-size: 13px;
          font-weight: 800;
        }
        .recharge-reference .instruction {
          margin: 0 0 12px 0;
          padding-left: 0;
          font-size: 14px;
          line-height: 1.55;
        }
        .recharge-reference .instruction::before { display: none; }
        .recharge-reference .instruction strong { color: #303640; }
        @media (max-width: 360px) {
          .recharge-reference .deposit-intro,
          .recharge-reference .account-summary,
          .recharge-reference .amount-panel,
          .recharge-reference .country-panel,
          .recharge-reference .instructions { margin-right: 12px; margin-left: 12px; }
          .recharge-reference .continue { width: calc(100% - 24px); margin-right: 12px; margin-left: 12px; }
          .recharge-reference .preset { font-size: 13px; }
        }
        .recharge-reference {
          background: #f0f1f8;
          color: #202124;
          font-family: Roboto, Arial, sans-serif;
        }
        .recharge-reference .recharge-screen {
          padding-bottom: calc(78px + env(safe-area-inset-bottom));
          background: #f0f1f8;
        }
        .recharge-reference .recharge-hero {
          height: 48px;
          padding: 0 54px;
          background: #00317d;
          border: 0;
        }
        .recharge-reference .recharge-title {
          font-size: 18px;
          font-weight: 700;
        }
        .recharge-reference .recharge-back {
          top: 6px;
          width: 36px;
          height: 36px;
          border: 0;
          border-radius: 50%;
          background: rgb(255 255 255 / 12%);
          color: #fff;
          box-shadow: none;
        }
        .recharge-reference .recharge-back:active {
          background: rgb(255 255 255 / 20%);
          color: #fff;
          box-shadow: none;
        }
        .recharge-reference .deposit-intro,
        .recharge-reference .account-summary {
          display: none;
        }
        .recharge-reference .presets-panel {
          margin: 18px 18px 0;
          padding: 16px;
          border: 1px solid #e1e5ed;
          border-radius: 15px;
          background: #fff;
          box-shadow: 0 2px 8px rgb(25 44 78 / 7%);
        }
        .recharge-reference .preset-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin: 0;
        }
        .recharge-reference .preset {
          min-width: 0;
          min-height: 48px;
          border: 0;
          border-radius: 999px;
          background: #f4f5f8;
          color: #202124;
          font-size: 15px;
          font-weight: 700;
          box-shadow: none;
        }
        .recharge-reference .preset.active {
          border: 0;
          background: ${TON_GRADIENT};
          color: #fff;
          box-shadow: 0 4px 9px rgb(13 48 104 / 22%);
        }
        .recharge-reference .amount-panel {
          margin: 16px 18px 0;
          padding: 18px;
          border: 1px solid #e1e5ed;
          border-radius: 15px;
          background: #fff;
          box-shadow: 0 2px 8px rgb(25 44 78 / 7%);
        }
        .recharge-reference .amount-balance {
          display: flex;
          align-items: baseline;
          gap: 9px;
          margin: 0 0 16px;
          color: #252a32;
          font-size: 15px;
        }
        .recharge-reference .amount-balance strong {
          color: #41464f;
          font-size: 15px;
          font-weight: 500;
        }
        .recharge-reference .amount-label {
          margin: 0 0 9px;
          padding: 0;
          border: 0;
          color: #252a32;
          font-size: 15px;
          font-weight: 500;
        }
        .recharge-reference .amount-input {
          height: 54px;
          border: 1px solid transparent;
          border-radius: 10px;
          background: #f0f2f9;
          box-shadow: none;
        }
        .recharge-reference .amount-input:focus-within {
          border-color: #00317d;
          box-shadow: none;
        }
        .recharge-reference .amount-input input { font-size: 18px; font-weight: 700; }
        .recharge-reference .country-panel {
          margin: 16px 18px 0;
          padding: 16px;
          border: 1px solid #e1e5ed;
          border-radius: 15px;
          background: #fff;
          box-shadow: 0 2px 8px rgb(25 44 78 / 7%);
        }
        .recharge-reference .country-heading {
          margin-bottom: 11px;
          color: #252a32;
          font-size: 15px;
          font-weight: 700;
        }
        .recharge-reference .country-select {
          min-height: 52px;
          border: 0;
          border-radius: 999px;
          background: #f0f2f9;
          color: #123a78;
          box-shadow: none;
        }
        .recharge-reference .country-select:hover { background: #e9edf6; }
        .recharge-reference .country-select:focus-visible {
          border: 1px solid #00317d;
          box-shadow: none;
        }
        .recharge-reference .continue {
          width: calc(100% - 36px);
          min-height: 55px;
          margin: 16px 18px 0;
          border: 0;
          border-radius: 999px;
          background: ${TON_GRADIENT};
          box-shadow: 0 4px 10px rgb(13 48 104 / 22%);
          font-size: 17px;
        }
        .recharge-reference .continue:active:not(:disabled) {
          transform: translateY(2px);
          box-shadow: 0 2px 5px rgb(13 48 104 / 18%);
        }
        .recharge-reference .instructions {
          display: grid;
          gap: 12px;
          margin: 16px 18px 20px;
          padding: 0;
          border: 0;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
        }
        .recharge-reference .instructions-title { display: none; }
        .recharge-reference .instruction {
          margin: 0;
          border-left: 2px solid #00317d;
          padding: 11px 14px;
          background: #f1f3f8;
          color: #344b60;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 14px;
          line-height: 1.5;
        }
        .recharge-reference .instruction strong {
          color: #183d73;
          font-weight: 700;
        }
        @media (max-width: 360px) {
          .recharge-reference .presets-panel,
          .recharge-reference .amount-panel,
          .recharge-reference .country-panel,
          .recharge-reference .instructions {
            margin-right: 12px;
            margin-left: 12px;
          }
          .recharge-reference .continue {
            width: calc(100% - 24px);
            margin-right: 12px;
            margin-left: 12px;
          }
        }
      `}</style>

      <div className="recharge-screen">
        <header className="recharge-hero" aria-label="Dépôt">
          <h1 className="recharge-title">
            <span>Dépôt</span>
          </h1>
          <Link href="/my-page" className="recharge-back" aria-label="Retour à l’accueil">
              <ChevronLeft className="h-6 w-6" strokeWidth={2.6} aria-hidden="true" />
          </Link>
        </header>

        <section className="presets-panel" aria-label="Montants proposés">
          <div className="preset-row">
            {depositPresets.map((preset) => (
              <button
                key={preset}
                type="button"
                className={`preset ${amount === preset ? "active" : ""}`}
                disabled={preset < MIN_DEPOSIT}
                aria-label={`${preset.toLocaleString("fr-FR")} ${currency}${preset < MIN_DEPOSIT ? " - inférieur au minimum" : ""}`}
                aria-pressed={amount === preset}
                onClick={() => setAmount(preset)}
              >
                {preset.toLocaleString("fr-FR")}
              </button>
            ))}
          </div>
        </section>

        <section className="amount-panel" aria-label="Montant de recharge">
          <p className="amount-balance">
            <span>Solde disponible :</span>
            <strong>{accountBalance.toLocaleString("fr-FR")} {currency}</strong>
          </p>
          <p className="amount-label">Montant du dépôt</p>
          <label className="amount-input">
            <span className="currency">{currency}</span>
            <input
              type="number"
              inputMode="numeric"
              value={amount}
              onChange={(event) => setAmount(event.target.value ? Number(event.target.value) : "")}
              placeholder="Saisissez le montant"
              aria-label="Montant de recharge"
            />
          </label>
        </section>

        <section className="country-panel" aria-label="Pays et institutions de recharge">
          <h2 className="country-heading">Pays de dépôt</h2>
          <div className="country-options">
            <button
              type="button"
              className="country-select"
              onClick={() => setShowCountrySelector(true)}
              aria-label={`Pays de dépôt : ${countryInfo?.name || "sélectionner un pays"}`}
              aria-haspopup="dialog"
              aria-expanded={showCountrySelector}
              data-testid="button-select-deposit-country"
            >
              <span>{countryInfo?.name || "Sélectionnez un pays"}</span>
              {countryInfo?.phonePrefix && <span className="country-select-prefix">+{countryInfo.phonePrefix}</span>}
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {activeDepositCountries.length === 0 && !countriesError && (
            <p className="text-sm text-gray-600">Aucun pays de dépôt n’est disponible pour le moment.</p>
          )}
          {countriesError && <p className="mt-2 text-xs text-amber-700">Liste locale temporaire affichée.</p>}
          {depositCountry && !depositMethodsLoading &&
            (depositMethodsError || depositMethods.length === 0 || depositMethods.length > 1) && (
              <p role="alert" className="mt-2 text-sm text-red-700">
                {depositMethodsError
                  ? "Impossible de vérifier les options de paiement pour ce pays."
                  : depositMethods.length > 1
                    ? "Plusieurs options de paiement sont configurées pour ce pays. Contactez le service client."
                    : "Aucune option de paiement n’est disponible pour ce pays."}
              </p>
            )}
        </section>

        <button
          className="continue"
          onClick={handleAmountNext}
          disabled={
            !depositCountry ||
            settingsRefreshing ||
            depositMethodsLoading ||
            !selectedDepositMethod ||
            inpayInitiateMutation.isPending ||
            wpInitiateMutation.isPending
          }
        >
          Continuer
        </button>

        <section className="instructions" aria-label="Bon à savoir">
          <p className="instruction">
            Montant minimum de dépôt :{" "}
            <strong>{settingsRefreshing ? "Actualisation…" : `${MIN_DEPOSIT.toLocaleString("fr-FR")} ${currency}`}</strong>
          </p>
          <p className="instruction">Vérifiez attentivement vos informations de compte lors du virement pour que votre paiement soit traité correctement.</p>
          <p className="instruction">Chaque commande possède ses propres informations de paiement ; ne réutilisez pas les informations précédentes pour un second paiement.</p>
          <p className="instruction">Après un virement réussi, veuillez patienter 10 à 30 minutes.</p>
        </section>
        <CountrySelector
          open={showCountrySelector}
          onClose={() => setShowCountrySelector(false)}
          onSelect={setDepositCountry}
          selectedCountryCode={depositCountry}
          allowedCountryCodes={activeDepositCountries.map((item) => item.code)}
        />
      </div>
      <BottomNav />
    </main>
  );

  // ── STEP 3: Manual deposit form ────────────────────────────────────────────
  if (step === "form" && selectedNumber) return (
    <div className="deposit-step-shell">
      <DepositStepStyles />
      <header className="deposit-step-header">
        <button className="deposit-step-back" onClick={() => setStep("amount")}>
          <ChevronLeft className="w-5 h-5" />
          <span className="font-semibold text-base">Confirmer le paiement</span>
        </button>
      </header>

      <div className="deposit-step-content space-y-4 pb-10">
        <div className="deposit-step-card deposit-step-card-accent p-4 flex items-center gap-3">
          {selectedNumber.logoUrl ? (
            <img src={selectedNumber.logoUrl} alt={selectedNumber.operatorName} className="w-10 h-10 rounded-lg object-contain" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border-2 border-[#D40030]">
              <Phone className="w-5 h-5 text-[#D40030]" />
            </div>
          )}
          <div className="flex-1">
            <p className="text-xs text-gray-500">{selectedNumber.paymentLink ? "Lien de paiement" : "Numéro destinataire"}</p>
            {selectedNumber.paymentLink ? (
              <a
                href={withCoteDIvoireWaveAmount(selectedNumber.paymentLink, Number(amount), country) || selectedNumber.paymentLink}
                target="_blank"
                rel="noreferrer"
                className="mt-1 flex items-center gap-1 text-sm font-bold text-[#A60026] underline"
              >
                <ExternalLink className="h-4 w-4" /> Ouvrir le lien de paiement
              </a>
            ) : (
              <p className="font-bold text-[#A60026] text-sm">{selectedNumber.operatorName} — {selectedNumber.phone}</p>
            )}
            <p className="text-xs text-gray-500">{selectedNumber.ownerName}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Montant</p>
            <p className="font-bold text-gray-800">{Number(amount).toLocaleString()} {currency}</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-800 mb-2">Votre numéro payeur</p>
            <div className="deposit-step-field flex items-center overflow-hidden">
            <Phone className="w-4 h-4 text-gray-400 ml-4" />
            <input
              type="tel"
              value={senderPhone}
              onChange={(e) => setSenderPhone(e.target.value)}
              placeholder="Numéro depuis lequel vous avez payé"
              className="flex-1 px-3 py-4 text-sm text-gray-700 outline-none bg-transparent"
            />
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-800 mb-2">Référence / ID transaction <span className="text-gray-400 font-normal">(optionnel)</span></p>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Numéro de référence de la transaction"
            className="deposit-step-field w-full px-4 py-4 text-sm text-gray-700 outline-none"
          />
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-800 mb-2">Message reçu après paiement <span className="text-gray-400 font-normal">(optionnel)</span></p>
          <textarea
            value={paymentMessage}
            onChange={(e) => setPaymentMessage(e.target.value)}
            placeholder="Collez ici le SMS ou message de confirmation reçu..."
            rows={3}
            className="deposit-step-field w-full px-4 py-3 text-sm text-gray-700 outline-none resize-none"
          />
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-800 mb-2">Capture d'écran du paiement <span className="text-red-500">*</span></p>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`w-full border-2 border-dashed rounded-xl py-7 flex flex-col items-center gap-2 transition-colors ${
              screenshot ? "border-[#D40030] bg-[#FFF0F3]" : "border-gray-300 bg-gray-50 hover:border-[#D40030] hover:bg-[#FFF0F3]"
            }`}
          >
            {screenshot ? (
              <><CheckCircle className="w-8 h-8 text-[#D40030]" /><p className="text-sm font-medium text-[#A60026]">{screenshotName}</p><p className="text-xs text-gray-400">Appuyez pour changer</p></>
            ) : (
              <><ImageIcon className="w-8 h-8 text-gray-400" /><p className="text-sm font-medium text-gray-600">Appuyez pour ajouter la capture</p><p className="text-xs text-gray-400">JPG, PNG — max 5 Mo</p></>
            )}
          </button>
          {screenshot && (
            <div className="mt-3 rounded-xl overflow-hidden border border-gray-100">
              <img src={screenshot} alt="Capture" className="w-full max-h-52 object-contain bg-gray-50" />
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={depositMutation.isPending}
          className="deposit-step-primary w-full py-5 disabled:opacity-50"
          style={{ background: TON_GRADIENT }}
        >
          {depositMutation.isPending ? (
            <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Envoi en cours...</span>
          ) : (
            <span className="flex items-center justify-center gap-2"><Upload className="w-5 h-5" /> Soumettre ma demande</span>
          )}
        </button>
      </div>
    </div>
  );

  // ── WESTPAY: Confirm + redirect ────────────────────────────────────────────
  if (step === "westpay") return (
    <div className="deposit-step-shell">
      <DepositStepStyles />
      <header className="deposit-step-header">
        <button className="deposit-step-back" onClick={() => setStep("amount")}>
          <ChevronLeft className="w-5 h-5" />
          <span className="font-semibold text-base">Paiement Mobile Money</span>
        </button>
      </header>

      <div className="deposit-step-content space-y-5 pb-10">
        {/* Amount recap */}
        <div className="deposit-step-summary mx-0 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Montant à déposer</p>
            <p className="text-xl font-bold text-[#A60026]">{Number(amount).toLocaleString()} {currency}</p>
          </div>
          <button onClick={() => setStep("amount")} className="text-xs text-[#A60026] underline">Modifier</button>
        </div>

        {/* Info card */}
        <div className="deposit-step-card p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#D40030]" />
            <p className="font-semibold text-gray-900 text-sm">Comment ça marche ?</p>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            1. Cliquez sur <strong>Continuer le paiement</strong> — vous serez redirigé vers la page de paiement sécurisée.
          </p>
          <p className="text-xs text-gray-600 leading-relaxed">
            2. Entrez votre numéro Mobile Money et validez le paiement USSD depuis votre téléphone.
          </p>
          <p className="text-xs text-gray-600 leading-relaxed">
            3. Après paiement, vous serez automatiquement redirigé ici. Votre solde est crédité après confirmation.
          </p>
        </div>

        <button
          onClick={() => wpInitiateMutation.mutate()}
          disabled={wpInitiateMutation.isPending}
          className="deposit-step-primary w-full py-5 disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: TON_GRADIENT }}
        >
          {wpInitiateMutation.isPending ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Redirection en cours...</>
          ) : (
            <><ExternalLink className="w-5 h-5" /> Continuer le paiement</>
          )}
        </button>

        <p className="text-xs text-center text-gray-400">
          Paiement sécurisé — USSD Mobile Money
        </p>
      </div>
    </div>
  );

  // ── ASHTECHPAY: Select country + operator ─────────────────────────────────
  if (step === "ashtech-operator") return (
    <div className="deposit-step-shell">
      <DepositStepStyles />
      <header className="deposit-step-header">
        <button className="deposit-step-back" onClick={() => setStep("amount")}>
          <ChevronLeft className="w-5 h-5" />
          <span className="font-semibold text-base">Paiement Mobile Money</span>
        </button>
        <Link href="/deposits-history?from=deposit"><button className="deposit-step-history">Historique</button></Link>
      </header>
      <div className="deposit-step-summary mx-4 mt-4 p-4 flex items-center justify-between">
        <div><p className="text-xs text-gray-500">Montant à déposer</p><p className="text-xl font-bold text-[#A60026]">{Number(amount).toLocaleString()} {currency}</p></div>
        <button onClick={() => setStep("amount")} className="text-xs text-[#A60026] underline">Modifier</button>
      </div>
      <div className="deposit-step-content space-y-4 pb-10">
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-2">Pays</p>
          {ashtechCountriesLoading ? <Loader2 className="w-6 h-6 animate-spin text-[#D40030] mx-auto" /> : (
            <select value={ashtechCountry} onChange={(e) => { setAshtechCountry(e.target.value); setAshtechOperator(""); }}
              className="deposit-step-field w-full px-4 py-4 text-sm text-gray-700 outline-none appearance-none">
              {availableAshtechCountries.map(c => <option key={c.code} value={c.code}>{c.name} ({c.currency})</option>)}
            </select>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-2">Numéro Mobile Money</p>
          <div className="deposit-step-field flex items-center overflow-hidden">
            <Phone className="w-4 h-4 text-gray-400 ml-4 flex-shrink-0" />
            <input type="tel" inputMode="numeric" value={ashtechPhone} onChange={(e) => setAshtechPhone(e.target.value)}
              placeholder="Votre numéro Mobile Money" className="flex-1 px-3 py-4 text-sm text-gray-700 outline-none bg-transparent" />
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-2">Opérateur Mobile Money</p>
          {ashtechOperators.length === 0 ? <p className="text-sm text-gray-400 text-center py-5">Aucun opérateur disponible pour ce pays</p> : (
            <div className="space-y-2">
              {ashtechOperators.map((operator, index) => {
                const name = typeof operator === "string" ? operator : (operator.name || operator.code || `Opérateur ${index + 1}`);
                return <button key={`${name}-${index}`} onClick={() => setAshtechOperator(name)}
                  className={`deposit-step-operator w-full flex items-center justify-between px-4 py-4 ${ashtechOperator === name ? "deposit-step-operator-selected" : ""}`}>
                  <span className="font-semibold text-gray-900 text-sm">{name}</span>
                  {ashtechOperator === name && <CheckCircle className="w-5 h-5 text-[#D40030]" />}
                </button>;
              })}
            </div>
          )}
        </div>
        <button onClick={() => ashtechCollectMutation.mutate(undefined)} disabled={!ashtechOperator || !ashtechPhone.trim() || ashtechCollectMutation.isPending}
          className="deposit-step-primary w-full py-5 disabled:opacity-40" style={{ background: TON_GRADIENT }}>
          {ashtechCollectMutation.isPending ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Initiation en cours...</span> : "Initier le paiement"}
        </button>
      </div>
    </div>
  );

  // ── ASHTECHPAY: OTP screen ────────────────────────────────────────────────
  if (step === "ashtech-otp") return (
    <div className="deposit-step-shell">
      <DepositStepStyles />
      <header className="deposit-step-header">
        <button onClick={() => setStep("ashtech-operator")} className="deposit-step-back"><ChevronLeft className="w-5 h-5" /><span>Code OTP</span></button>
      </header>
      <div className="deposit-step-content space-y-5 pb-10">
        <div className="deposit-step-card deposit-step-card-accent p-4">
          <p className="font-bold text-gray-900 text-sm mb-2">Code à composer</p>
          {ashtechUssdCode && <p className="deposit-step-otp px-4 py-3 text-center font-mono font-black text-2xl text-[#A60026] tracking-widest">{ashtechUssdCode}</p>}
          <p className="text-sm text-gray-600 mt-3">
            {ashtechUssdCode
              ? "Composez ce code sur votre téléphone pour obtenir le code OTP, puis saisissez-le ci-dessous."
              : "Un code OTP vous a été envoyé. Saisissez-le ci-dessous."}
          </p>
        </div>
        <input type="text" inputMode="numeric" value={ashtechOtp} onChange={(e) => setAshtechOtp(e.target.value)} maxLength={8}
          placeholder="Code OTP reçu par SMS" className="deposit-step-otp w-full px-4 py-4 text-center text-2xl tracking-widest font-black text-gray-800 outline-none focus:border-[#D40030]" />
        <button onClick={() => ashtechCollectMutation.mutate(ashtechOtp)} disabled={!ashtechOtp.trim() || ashtechCollectMutation.isPending}
          className="deposit-step-primary w-full py-5 disabled:opacity-40" style={{ background: TON_GRADIENT }}>
          {ashtechCollectMutation.isPending ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Vérification...</span> : "Valider le code OTP"}
        </button>
      </div>
    </div>
  );

  // ── ASHTECHPAY: Wave redirect ─────────────────────────────────────────────
  if (step === "ashtech-redirect") return (
    <div className="deposit-step-shell flex flex-col">
      <DepositStepStyles />
      <header className="deposit-step-header">
        <button onClick={() => setStep("ashtech-operator")} className="deposit-step-back"><ChevronLeft className="w-5 h-5" /><span>Finaliser le paiement</span></button>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="deposit-step-icon"><ExternalLink className="w-10 h-10 text-[#D40030]" /></div>
        <div><p className="font-bold text-gray-900 text-xl mb-2">Finaliser avec Wave</p><p className="text-sm text-gray-500">Ouvrez la page Wave pour confirmer votre dépôt de <strong>{Number(amount).toLocaleString()} {currency}</strong>.</p></div>
        <a href={ashtechWaveUrl} target="_blank" rel="noopener noreferrer" onClick={() => { setAshtechPolling(true); setStep("ashtech-waiting"); }}
          className="deposit-step-primary w-full py-5 flex items-center justify-center gap-2" style={{ background: TON_GRADIENT }}>
          <ExternalLink className="w-5 h-5" /> Ouvrir Wave
        </a>
      </div>
    </div>
  );

  // ── ASHTECHPAY: Waiting / polling ─────────────────────────────────────────
  if (step === "ashtech-waiting") return (
    <div className="deposit-step-shell flex flex-col">
      <DepositStepStyles />
      <header className="deposit-step-header"><span className="font-semibold text-base text-gray-800">Paiement en cours</span></header>
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="deposit-step-icon"><RefreshCw className="w-10 h-10 text-[#D40030] animate-spin" style={{ animationDuration: "2s" }} /></div>
        <div><p className="font-bold text-gray-900 text-xl">En attente de confirmation</p><p className="text-sm text-gray-500 mt-2">Validez le paiement sur votre téléphone. Cette page se met à jour automatiquement.</p></div>
        <div className="flex gap-3 w-full"><Link href="/deposits-history?from=deposit" className="flex-1"><button className="deposit-step-secondary w-full py-3 text-sm">Voir l'historique</button></Link>
          <button onClick={() => { setStep("amount"); setAmount(""); setAshtechDepositId(null); setAshtechPolling(false); setAshtechStatus(""); }} className="deposit-step-secondary flex-1 py-3 text-sm">Nouvelle recharge</button>
        </div>
      </div>
    </div>
  );

  if (step === "soleaspay-waiting") return (
    <div className="deposit-step-shell flex flex-col">
      <DepositStepStyles />
      <header className="deposit-step-header">
        <span className="font-semibold text-base text-gray-800">Paiement en cours</span>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="deposit-step-icon">
          {soleaspayStatus === "approved"
            ? <CheckCircle className="w-10 h-10 text-[#D40030]" />
            : <RefreshCw className={`w-10 h-10 ${soleaspayStatus === "rejected" ? "text-red-400" : "text-[#D40030] animate-spin"}`} />}
        </div>
        <div>
          <p className="font-bold text-gray-900 text-xl">
            {soleaspayStatus === "approved" ? "Paiement confirmé !" : soleaspayStatus === "rejected" ? "Paiement échoué" : "En attente de confirmation"}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {soleaspayStatus === "approved"
              ? `Votre solde a été crédité de ${Number(amount).toLocaleString()} ${currency}.`
              : soleaspayStatus === "rejected"
                ? "Le paiement a été refusé ou annulé."
                : soleaspayMessage || "Validez la demande de paiement sur votre téléphone. Cette page se met à jour automatiquement."}
          </p>
          {soleaspayDepositId && <p className="text-xs text-gray-400 mt-2">Référence dépôt : #{soleaspayDepositId}</p>}
        </div>
        <div className="flex gap-3 w-full">
          {soleaspayStatus === "rejected" ? (
            <button
              onClick={() => {
                setSoleaspayDepositId(null);
                setSoleaspayStatus("");
                setSoleaspayPolling(false);
                window.location.href = `/robotpay?amount=${encodeURIComponent(Number(amount))}&country=${encodeURIComponent(country)}&provider=soleaspay`;
              }}
              className="deposit-step-primary flex-1 py-3 text-sm"
              style={{ background: TON_GRADIENT }}
            >
              Réessayer
            </button>
          ) : (
            <Link href="/deposits-history?from=deposit" className="flex-1">
              <button className="deposit-step-secondary w-full py-3 text-sm">Voir l'historique</button>
            </Link>
          )}
          <button
            onClick={() => {
              setStep("amount");
              setAmount("");
              setSoleaspayDepositId(null);
              setSoleaspayStatus("");
              setSoleaspayPolling(false);
            }}
            className="deposit-step-secondary flex-1 py-3 text-sm"
          >
            Nouvelle recharge
          </button>
        </div>
      </div>
    </div>
  );

  // ── SENDAVAPAY: Select country + operator ──────────────────────────────────
  if (step === "sv-operator") return (
    <div className="deposit-step-shell">
      <DepositStepStyles />
      <header className="deposit-step-header">
        <button className="deposit-step-back" onClick={() => setStep("amount")}>
          <ChevronLeft className="w-5 h-5" />
          <span className="font-semibold text-base">Top up</span>
        </button>
        <Link href="/deposits-history?from=deposit">
          <button className="deposit-step-history">Historique</button>
        </Link>
      </header>

      {/* Amount recap */}
      <div className="deposit-step-summary mx-4 mt-4 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">Montant à déposer</p>
          <p className="text-xl font-bold text-[#A60026]">{Number(amount).toLocaleString()} {currency}</p>
        </div>
        <button onClick={() => setStep("amount")} className="text-xs text-[#A60026] underline">Modifier</button>
      </div>

      <div className="deposit-step-content space-y-4 pb-10">
        {/* Country selector */}
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-2">Pays</p>
          <select
            value={svCountry}
            onChange={(e) => { setSvCountry(e.target.value); setSvOperator(null); }}
            className="deposit-step-field w-full px-4 py-4 text-sm text-gray-700 outline-none appearance-none"
          >
            {activeDepositCountries.map((c: any) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Phone number */}
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-2">Numéro Mobile Money</p>
          <div className="deposit-step-field flex items-center overflow-hidden">
            <Phone className="w-4 h-4 text-gray-400 ml-4 flex-shrink-0" />
            <input
              type="tel"
              inputMode="numeric"
              value={svPhone}
              onChange={(e) => setSvPhone(e.target.value)}
              placeholder="Numéro sur lequel envoyer la demande"
              className="flex-1 px-3 py-4 text-sm text-gray-700 outline-none bg-transparent"
            />
          </div>
        </div>

        {/* Operator selector */}
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-2">Opérateur Mobile Money</p>
          {svOperatorsLoading ? (
            <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#D40030]" />
            </div>
          ) : svOperators.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">Aucun opérateur disponible pour ce pays</p>
            </div>
          ) : (
            <div className="space-y-2">
              {svOperators.map((op) => {
                const icon = getOperatorIcon(op.name);
                return (
                  <button
                    key={op.id}
                    onClick={() => setSvOperator(op)}
                    className={`deposit-step-operator w-full flex items-center justify-between px-4 py-4 transition-all ${
                      svOperator?.id === op.id
                        ? "deposit-step-operator-selected"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {icon ? (
                        <img src={icon} alt={op.name} className="w-10 h-10 rounded-full object-cover border border-gray-100" />
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          svOperator?.id === op.id ? "bg-[#D40030] text-white" : "bg-gray-100 text-gray-600"
                        }`}>
                          {op.name.charAt(0)}
                        </div>
                      )}
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 text-sm">{op.name}</p>
                        {op.requiresOtp && <p className="text-xs text-[#A60026]">Code OTP requis</p>}
                      </div>
                    </div>
                    {svOperator?.id === op.id && <CheckCircle className="w-5 h-5 text-[#D40030]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button
          onClick={() => svInitiateMutation.mutate()}
          disabled={!svOperator || svInitiateMutation.isPending}
           className="deposit-step-primary w-full py-5 disabled:opacity-40"
            style={{ background: TON_GRADIENT }}
        >
          {svInitiateMutation.isPending ? (
            <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Initiation en cours...</span>
          ) : (
            <span className="flex items-center justify-center gap-2"><img src="/topup-icon.png" className="w-6 h-6 object-contain" alt="topup" /> Initier le paiement</span>
          )}
        </button>
      </div>
    </div>
  );

  // ── SENDAVAPAY: OTP screen ─────────────────────────────────────────────────
  if (step === "sv-otp") return (
    <div className="deposit-step-shell">
      <DepositStepStyles />
      <header className="deposit-step-header">
        <button onClick={() => setStep("sv-operator")} className="deposit-step-back">
          <ChevronLeft className="w-5 h-5" />
          <span className="font-semibold text-base">Code OTP</span>
        </button>
      </header>

      <div className="deposit-step-content space-y-5 pb-10">

        {/* Step 1 — Dial USSD code */}
        <div className="deposit-step-card deposit-step-card-accent p-4">
          <div className="flex items-center gap-2 mb-3">
           <div className="w-7 h-7 rounded-full bg-[#D40030] flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">1</span>
            </div>
            <p className="font-bold text-gray-900 text-sm">Composez ce code sur votre téléphone</p>
          </div>
          {svUssdCode ? (
             <div className="deposit-step-otp px-4 py-3 text-center">
              <p className="font-mono font-black text-2xl text-[#A60026] tracking-widest">{svUssdCode}</p>
              <p className="text-xs text-gray-400 mt-1">Composez ce code USSD sur votre téléphone</p>
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              Composez le code USSD de votre opérateur (ex&nbsp;: <span className="font-mono font-bold text-[#A60026]">*144#</span>) sur votre téléphone pour recevoir le code OTP par SMS.
            </p>
          )}
        </div>

        {/* Step 2 — Enter OTP */}
        <div className="deposit-step-card deposit-step-card-accent p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-[#D40030] flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">2</span>
            </div>
            <p className="font-bold text-gray-900 text-sm">Entrez le code OTP reçu par SMS</p>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Après avoir composé le code, vous recevrez un SMS avec un code OTP. Saisissez-le ci-dessous pour confirmer le paiement de <strong>{Number(amount).toLocaleString()} {currency}</strong>.
          </p>
         <input
            type="text"
            inputMode="numeric"
            value={svOtp}
            onChange={(e) => setSvOtp(e.target.value)}
            placeholder="Code OTP reçu par SMS"
           className="deposit-step-otp w-full px-4 py-4 text-center text-2xl tracking-widest font-black text-gray-800 outline-none focus:border-[#D40030]"
            maxLength={8}
          />
        </div>

         <button
          onClick={() => svOtpMutation.mutate()}
          disabled={!svOtp.trim() || svOtpMutation.isPending}
           className="deposit-step-primary w-full py-5 disabled:opacity-40"
          style={{ background: TON_GRADIENT }}
        >
          {svOtpMutation.isPending ? (
            <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Vérification...</span>
          ) : "Valider le code OTP"}
        </button>
      </div>
    </div>
  );

  // ── SENDAVAPAY: Redirect screen (Wave, etc.) ──────────────────────────────
  if (step === "sv-redirect") return (
    <div className="deposit-step-shell flex flex-col">
      <DepositStepStyles />
      <header className="deposit-step-header">
        <button onClick={() => setStep("sv-operator")} className="deposit-step-back">
          <ChevronLeft className="w-5 h-5" />
          <span className="font-semibold text-base">Finaliser le paiement</span>
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="deposit-step-icon">
          <ExternalLink className="w-10 h-10 text-[#D40030]" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-xl mb-2">Finaliser sur l'application</p>
          <p className="text-sm text-gray-500">
            Appuyez sur le bouton ci-dessous pour ouvrir la page de paiement de l'opérateur
            et confirmer votre dépôt de <strong>{Number(amount).toLocaleString()} {currency}</strong>.
          </p>
        </div>
        <a
          href={svRedirectUrl}
          target="_blank"
          rel="noopener noreferrer"
           className="deposit-step-primary w-full py-5 flex items-center justify-center gap-2"
           style={{ background: TON_GRADIENT }}
          onClick={() => { setSvPolling(true); setStep("sv-waiting"); }}
        >
          <ExternalLink className="w-5 h-5" /> Ouvrir la page de paiement
        </a>
      </div>
    </div>
  );

  // ── SENDAVAPAY: Waiting / polling screen ────────────────────────────────────
  if (step === "sv-waiting") return (
    <div className="deposit-step-shell flex flex-col">
      <DepositStepStyles />
      <header className="deposit-step-header">
        <span className="font-semibold text-base text-gray-800">Paiement en cours</span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
        {svStatus === "approved" ? (
          <>
            <div className="deposit-step-icon">
              <CheckCircle className="w-10 h-10 text-[#D40030]" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-xl">Paiement confirmé !</p>
              <p className="text-sm text-gray-500 mt-1">Votre solde a été crédité de <strong>{Number(amount).toLocaleString()} {currency}</strong></p>
            </div>
          </>
        ) : svStatus === "rejected" ? (
          <>
            <div className="deposit-step-icon">
              <RefreshCw className="w-10 h-10 text-red-400" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-xl">Paiement échoué</p>
              <p className="text-sm text-gray-500 mt-1">Le paiement a été refusé ou annulé.</p>
            </div>
            <div className="flex gap-3 w-full">
              {svPaymentToken && (
                <button
                  onClick={() => svRetryMutation.mutate()}
                  disabled={svRetryMutation.isPending}
                   className="deposit-step-primary flex-1 py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                   style={{ background: TON_GRADIENT }}
                >
                  {svRetryMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Réessayer
                </button>
              )}
              <button
                onClick={() => { setStep("amount"); setAmount(""); setSvOperator(null); setSvDepositId(null); setSvPaymentToken(""); setSvPolling(false); setSvStatus(""); }}
                 className="deposit-step-secondary flex-1 py-3 text-sm"
              >
                Nouvelle recharge
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="deposit-step-icon">
               <RefreshCw className="w-10 h-10 text-[#D40030] animate-spin" style={{ animationDuration: "2s" }} />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-xl">En attente de confirmation</p>
              <p className="text-sm text-gray-500 mt-2">
                Une demande de paiement de <strong>{Number(amount).toLocaleString()} {currency}</strong> a été envoyée sur votre téléphone.<br />
                Acceptez-la sur votre téléphone. Cette page se met à jour automatiquement.
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <Link href="/deposits-history?from=deposit" className="flex-1">
                 <button className="deposit-step-secondary w-full py-3 text-sm">
                  Voir l'historique
                </button>
              </Link>
              <button
                onClick={() => { setStep("amount"); setAmount(""); setSvOperator(null); setSvDepositId(null); setSvPaymentToken(""); setSvPolling(false); setSvStatus(""); }}
                 className="deposit-step-secondary flex-1 py-3 text-sm"
              >
                Nouvelle recharge
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return null;
}
