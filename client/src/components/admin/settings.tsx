import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient, FRESH_PLATFORM_SETTINGS_QUERY_OPTIONS } from "@/lib/queryClient";
import { Loader2, Save, Link, Clock, Users, Zap, RefreshCw } from "lucide-react";
import AdminClapayCountryBalances from "@/components/admin/clapay-country-balances";
import {
  DEFAULT_DEPOSIT_COMMISSION_LEVEL1,
  DEFAULT_DEPOSIT_COMMISSION_LEVEL2,
  DEFAULT_DEPOSIT_COMMISSION_LEVEL3,
  DEFAULT_HOME_WITHDRAWAL_PROCESSING_TEXT,
  DEFAULT_MAX_WITHDRAWALS_PER_DAY,
  DEFAULT_MINIMUM_DEPOSIT,
  DEFAULT_MINIMUM_WITHDRAWAL,
  DEFAULT_PURCHASE_COMMISSION_LEVEL1,
  DEFAULT_PURCHASE_COMMISSION_LEVEL2,
  DEFAULT_PURCHASE_COMMISSION_LEVEL3,
  DEFAULT_SIGNUP_BONUS,
  DEFAULT_WITHDRAWAL_END_HOUR,
  DEFAULT_WITHDRAWAL_FEE_PERCENT,
  DEFAULT_WITHDRAWAL_PREPAYMENT_RATE,
  DEFAULT_WITHDRAWAL_PROCESSING_TEXT,
  DEFAULT_WITHDRAWAL_START_HOUR,
  readPositiveIntegerSetting,
  readPercentageSetting,
} from "@shared/platform-settings";
import {
  deriveClapayPayoutCountries,
  deriveClapayRoutedCountries,
} from "@shared/clapay-payout-countries";
import {
  DEPOSIT_METHOD_IDS,
  type DepositMethodId,
} from "@shared/deposit-method-routing";
import {
  parseDepositOperatorsByCountry,
  type DepositOperatorProviderId,
  type DepositOperatorsByCountry,
} from "@shared/deposit-operator-routing";

type AdminCountry = { code: string; name: string; currency?: string; isActive: boolean };
type DepositOperatorOption = { id: string; name: string; requiresOtp?: boolean };
type DepositOperatorCatalog = {
  operators: DepositOperatorOption[];
  selectedIds: string[];
};

const DEPOSIT_METHOD_OPTIONS: Array<{ value: DepositMethodId; label: string }> = [
  { value: "manual", label: "Paiement manuel" },
  { value: "soleaspay", label: "SoleaPay" },
  { value: "ashtech", label: "AshtechPay" },
  { value: "sendavapay", label: "SendavaPay" },
  { value: "westpay", label: "WestPay" },
  { value: "inpay", label: "InPay" },
  { value: "clapay", label: "Clapay" },
];
const DEPOSIT_OPERATOR_OPTIONS: Array<{ value: DepositOperatorProviderId; label: string }> = [
  { value: "soleaspay", label: "SoleaPay" },
  { value: "ashtech", label: "AshtechPay" },
  { value: "sendavapay", label: "SendavaPay" },
  { value: "clapay", label: "Clapay" },
];

function getInitialDepositRouting(
  settings: Record<string, string>,
  countries: AdminCountry[],
  paymentNumbers: Array<{ country: string; isActive: boolean }>,
): Record<string, DepositMethodId[]> {
  const parsed = settings.depositMethodsByCountry;
  if (parsed) {
    try {
      const stored = JSON.parse(parsed) as Record<string, unknown>;
      return Object.fromEntries(countries.map(({ code }) => {
        const methods = Array.isArray(stored[code.toUpperCase()])
          ? (stored[code.toUpperCase()] as unknown[]).filter(
              (method): method is DepositMethodId =>
                typeof method === "string" &&
                DEPOSIT_METHOD_IDS.includes(method as DepositMethodId),
            )
          : [];
        return [code.toUpperCase(), methods];
      }));
    } catch {
      return Object.fromEntries(countries.map(({ code }) => [code.toUpperCase(), []]));
    }
  }

  const countryAllowed = (value: string | undefined, code: string, emptyMeansAll = false) => {
    const configured = (value || "").split(",").map((item) => item.trim().toUpperCase()).filter(Boolean);
    return configured.length === 0 ? emptyMeansAll : configured.includes(code);
  };
  return Object.fromEntries(countries.map(({ code }) => {
    const normalizedCode = code.toUpperCase();
    const methods: DepositMethodId[] = [];
    if (settings.soleaspayEnabled === "true" && countryAllowed(settings.soleaspayCountries, normalizedCode)) {
      methods.push("soleaspay");
    }
    if (settings.ashtechEnabled === "true" && countryAllowed(settings.ashtechCountries, normalizedCode, true)) {
      methods.push("ashtech");
    }
    if (settings.sendavapayEnabled === "true") methods.push("sendavapay");
    if (settings.westpayEnabled === "true" && countryAllowed(settings.westpayCountries, normalizedCode, true)) {
      methods.push("westpay");
    }
    if (settings.inpayEnabled === "true" && countryAllowed(settings.inpayCountries, normalizedCode)) {
      methods.push("inpay");
    }
    if (paymentNumbers.some((number) => number.isActive && number.country.toUpperCase() === normalizedCode)) {
      methods.push("manual");
    }
    return [normalizedCode, methods];
  }));
}

const NETWORKS = [
  { value: "telegram", label: "Telegram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
];
const percentageSettingSchema = (minimum = 0) => z.string().refine((value) => {
  const parsed = Number(value);
  return value.trim() !== "" && Number.isFinite(parsed) && parsed >= minimum && parsed <= 100;
}, "Entrez un pourcentage valide");
const integerSettingSchema = (minimum: number, maximum = Number.MAX_SAFE_INTEGER) => z.string()
  .regex(/^\d+$/, "Entrez un nombre entier")
  .refine((value) => {
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed >= minimum && parsed <= maximum;
  }, "La valeur est hors limites");

const settingsSchema = z.object({
  supportLink: z.string().min(5, "Lien requis"),
  supportType: z.string().min(1, "Réseau requis"),
  supportLabel: z.string().min(1, "Label requis"),
  support2Link: z.string().min(5, "Lien requis"),
  support2Type: z.string().min(1, "Réseau requis"),
  support2Label: z.string().min(1, "Label requis"),
  channelLink: z.string().min(5, "Lien requis"),
  channelType: z.string().min(1, "Réseau requis"),
  channelLabel: z.string().min(1, "Label requis"),
  groupLink: z.string().min(5, "Lien requis"),
  groupType: z.string().min(1, "Réseau requis"),
  groupLabel: z.string().min(1, "Label requis"),
  popupButtonLabel: z.string().trim().min(1, "Label requis").max(12, "Le libellé doit rester court"),
  homeWithdrawalProcessingText: z.string().trim().min(1, "Texte requis").max(200),
  supportEnabled: z.boolean(),
  support2Enabled: z.boolean(),
  channelEnabled: z.boolean(),
  groupEnabled: z.boolean(),
  signupBonus: integerSettingSchema(0),
  minDeposit: integerSettingSchema(1),
  minWithdrawal: integerSettingSchema(1),
  withdrawalProcessingText: z.string().trim().min(1, "Texte requis").max(250)
    .refine((value) => value.includes("{currency}") && value.includes("{amount}"), "Conservez {currency} et {amount} dans le texte"),
  withdrawalFees: percentageSettingSchema(),
  maxWithdrawalsPerDay: integerSettingSchema(1, 10),
  withdrawalStartHour: integerSettingSchema(0, 23),
  withdrawalEndHour: integerSettingSchema(0, 23),
  withdrawalPrepaymentEnabled: z.boolean(),
  withdrawalPrepaymentRate: percentageSettingSchema(1),
  level1Commission: percentageSettingSchema(),
  level2Commission: percentageSettingSchema(),
  level3Commission: percentageSettingSchema(),
  depositCommissionLevel1: percentageSettingSchema(),
  depositCommissionLevel2: percentageSettingSchema(),
  depositCommissionLevel3: percentageSettingSchema(),
  sendavapayEnabled: z.boolean(),
  sendavapayChannelName: z.string().min(1, "Nom requis"),
  soleaspayEnabled: z.boolean(),
  soleaspayChannelName: z.string().min(1, "Nom requis"),
  westpayEnabled: z.boolean(),
  westpayChannelName: z.string().min(1, "Nom requis"),
  ashtechEnabled: z.boolean(),
  ashtechChannelName: z.string().min(1, "Nom requis"),
  inpayEnabled: z.boolean(),
  inpayChannelName: z.string().min(1, "Nom requis"),
  clapayEnabled: z.boolean(),
  clapayChannelName: z.string().min(1, "Nom requis"),
}).refine(
  (values) => Number(values.withdrawalStartHour) < Number(values.withdrawalEndHour),
  { path: ["withdrawalEndHour"], message: "L’heure de fin doit être après l’heure de début." },
);

type SettingsForm = z.infer<typeof settingsSchema>;

interface AdminSettingsProps {
  isSuperAdmin: boolean;
}

export default function AdminSettings({ isSuperAdmin }: AdminSettingsProps) {
  const { toast } = useToast();

  const { data: settings, isLoading, isFetching: settingsRefreshing } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/settings"],
    ...FRESH_PLATFORM_SETTINGS_QUERY_OPTIONS,
  });
  const { data: countries = [], isLoading: countriesLoading } = useQuery<AdminCountry[]>({
    queryKey: ["/api/admin/countries"],
  });
  const { data: paymentNumbers = [], isLoading: paymentNumbersLoading } = useQuery<
    Array<{ country: string; isActive: boolean }>
  >({
    queryKey: ["/api/admin/payment-numbers"],
  });
  const [depositMethodsByCountry, setDepositMethodsByCountry] = useState<Record<string, DepositMethodId[]>>({});
  const [depositOperatorsByCountry, setDepositOperatorsByCountry] = useState<DepositOperatorsByCountry>({});
  const [depositOperatorCatalogs, setDepositOperatorCatalogs] = useState<
    Record<string, DepositOperatorCatalog>
  >({});
  const [loadingOperatorCatalogs, setLoadingOperatorCatalogs] = useState<Record<string, boolean>>({});

  const loadDepositOperatorCatalog = async (country: string, provider: DepositOperatorProviderId) => {
    const normalizedCountry = country.trim().toUpperCase();
    const key = `${normalizedCountry}:${provider}`;
    setLoadingOperatorCatalogs((current) => ({ ...current, [key]: true }));
    try {
      const response = await apiRequest(
        "GET",
        `/api/admin/deposit/operators/${provider}/${encodeURIComponent(normalizedCountry)}`,
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Impossible de charger les opérateurs");
      setDepositOperatorCatalogs((current) => ({
        ...current,
        [key]: {
          operators: Array.isArray(result.operators) ? result.operators : [],
          selectedIds: Array.isArray(result.selectedIds) ? result.selectedIds : [],
        },
      }));
    } catch (error: any) {
      toast({
        title: `Opérateurs ${provider} indisponibles`,
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingOperatorCatalogs((current) => ({ ...current, [key]: false }));
    }
  };

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      supportLink: "https://t.me/sybotx",
      supportType: "telegram",
      supportLabel: "Service client",
      support2Link: "https://t.me/sybotx",
      support2Type: "telegram",
      support2Label: "Service client 2",
      channelLink: "https://t.me/sybotx",
      channelType: "telegram",
      channelLabel: "Chaîne officielle",
      groupLink: "https://t.me/sybotx",
      groupType: "telegram",
      groupLabel: "Groupe de discussion",
      popupButtonLabel: "Groupe",
      homeWithdrawalProcessingText: DEFAULT_HOME_WITHDRAWAL_PROCESSING_TEXT,
      withdrawalProcessingText: DEFAULT_WITHDRAWAL_PROCESSING_TEXT,
      supportEnabled: true,
      support2Enabled: true,
      channelEnabled: true,
      groupEnabled: true,
      signupBonus: String(DEFAULT_SIGNUP_BONUS),
      minDeposit: String(DEFAULT_MINIMUM_DEPOSIT),
      minWithdrawal: String(DEFAULT_MINIMUM_WITHDRAWAL),
      withdrawalFees: String(DEFAULT_WITHDRAWAL_FEE_PERCENT),
      maxWithdrawalsPerDay: String(DEFAULT_MAX_WITHDRAWALS_PER_DAY),
      withdrawalStartHour: String(DEFAULT_WITHDRAWAL_START_HOUR),
      withdrawalEndHour: String(DEFAULT_WITHDRAWAL_END_HOUR),
      withdrawalPrepaymentEnabled: false,
      withdrawalPrepaymentRate: String(DEFAULT_WITHDRAWAL_PREPAYMENT_RATE),
      level1Commission: String(DEFAULT_PURCHASE_COMMISSION_LEVEL1),
      level2Commission: String(DEFAULT_PURCHASE_COMMISSION_LEVEL2),
      level3Commission: String(DEFAULT_PURCHASE_COMMISSION_LEVEL3),
      depositCommissionLevel1: String(DEFAULT_DEPOSIT_COMMISSION_LEVEL1),
      depositCommissionLevel2: String(DEFAULT_DEPOSIT_COMMISSION_LEVEL2),
      depositCommissionLevel3: String(DEFAULT_DEPOSIT_COMMISSION_LEVEL3),
      sendavapayEnabled: false,
      sendavapayChannelName: "SendavaPay",
      soleaspayEnabled: false,
      soleaspayChannelName: "SoleaPay",
      westpayEnabled: false,
      westpayChannelName: "WestPay",
      ashtechEnabled: false,
      ashtechChannelName: "AshtechPay",
      inpayEnabled: false,
      inpayChannelName: "InPay",
      clapayEnabled: false,
      clapayChannelName: "Clapay",
    },
  });
  const clapayEnabled = form.watch("clapayEnabled");
  const clapayPayoutCountries = useMemo(
    () => deriveClapayPayoutCountries(
      countries,
      depositMethodsByCountry,
      clapayEnabled,
    ),
    [countries, depositMethodsByCountry, clapayEnabled],
  );
  const clapayBalanceCountries = useMemo(
    () => deriveClapayRoutedCountries(countries, depositMethodsByCountry),
    [countries, depositMethodsByCountry],
  );

  useEffect(() => {
    if (settings) {
      form.reset({
        supportLink: settings.supportLink || "https://t.me/sybotx",
        supportType: settings.supportType || "telegram",
        supportLabel: settings.supportLabel || "Service client",
        support2Link: settings.support2Link || "https://t.me/sybotx",
        support2Type: settings.support2Type || "telegram",
        support2Label: settings.support2Label || "Service client 2",
        channelLink: settings.channelLink || "https://t.me/sybotx",
        channelType: settings.channelType || "telegram",
        channelLabel: settings.channelLabel || "Chaîne officielle",
        groupLink: settings.groupLink || "https://t.me/sybotx",
        groupType: settings.groupType || "telegram",
        groupLabel: settings.groupLabel || "Groupe de discussion",
        popupButtonLabel:
          settings.popupButtonLabel?.trim() && settings.popupButtonLabel.trim().length <= 12
            ? settings.popupButtonLabel.trim()
            : "Groupe",
        homeWithdrawalProcessingText: settings.homeWithdrawalProcessingText || DEFAULT_HOME_WITHDRAWAL_PROCESSING_TEXT,
        withdrawalProcessingText: settings.withdrawalProcessingText || DEFAULT_WITHDRAWAL_PROCESSING_TEXT,
        supportEnabled: settings.supportEnabled !== "false",
        support2Enabled: settings.support2Enabled !== "false",
        channelEnabled: settings.channelEnabled !== "false",
        groupEnabled: settings.groupEnabled !== "false",
        signupBonus: settings.signupBonus || String(DEFAULT_SIGNUP_BONUS),
        minDeposit: String(readPositiveIntegerSetting(settings.minDeposit, DEFAULT_MINIMUM_DEPOSIT)),
        minWithdrawal: String(readPositiveIntegerSetting(settings.minWithdrawal, DEFAULT_MINIMUM_WITHDRAWAL)),
        withdrawalFees: settings.withdrawalFees || String(DEFAULT_WITHDRAWAL_FEE_PERCENT),
        maxWithdrawalsPerDay: settings.maxWithdrawalsPerDay || String(DEFAULT_MAX_WITHDRAWALS_PER_DAY),
        withdrawalStartHour: settings.withdrawalStartHour || String(DEFAULT_WITHDRAWAL_START_HOUR),
        withdrawalEndHour: settings.withdrawalEndHour || String(DEFAULT_WITHDRAWAL_END_HOUR),
        withdrawalPrepaymentEnabled: settings.withdrawalPrepaymentEnabled === "true",
        withdrawalPrepaymentRate: String(readPercentageSetting(
          settings.withdrawalPrepaymentRate,
          DEFAULT_WITHDRAWAL_PREPAYMENT_RATE,
          1,
        )),
        level1Commission: settings.level1Commission || String(DEFAULT_PURCHASE_COMMISSION_LEVEL1),
        level2Commission: settings.level2Commission || String(DEFAULT_PURCHASE_COMMISSION_LEVEL2),
        level3Commission: settings.level3Commission || String(DEFAULT_PURCHASE_COMMISSION_LEVEL3),
        depositCommissionLevel1: String(readPercentageSetting(settings.depositCommissionLevel1, DEFAULT_DEPOSIT_COMMISSION_LEVEL1)),
        depositCommissionLevel2: String(readPercentageSetting(settings.depositCommissionLevel2, DEFAULT_DEPOSIT_COMMISSION_LEVEL2)),
        depositCommissionLevel3: String(readPercentageSetting(settings.depositCommissionLevel3, DEFAULT_DEPOSIT_COMMISSION_LEVEL3)),
        soleaspayEnabled: settings.soleaspayEnabled === "true",
        soleaspayChannelName: settings.soleaspayChannelName || "SoleaPay",
        westpayEnabled: settings.westpayEnabled === "true",
        westpayChannelName: settings.westpayChannelName || "WestPay",
        sendavapayEnabled: settings.sendavapayEnabled === "true",
        sendavapayChannelName: settings.sendavapayChannelName || "SendavaPay",
        ashtechEnabled: settings.ashtechEnabled === "true",
        ashtechChannelName: settings.ashtechChannelName || "AshtechPay",
        inpayEnabled: settings.inpayEnabled === "true",
        inpayChannelName: settings.inpayChannelName || "InPay",
        clapayEnabled: settings.clapayEnabled === "true",
        clapayChannelName: settings.clapayChannelName || "Clapay",
      });
      if (!countriesLoading && !paymentNumbersLoading) {
        setDepositMethodsByCountry(getInitialDepositRouting(settings, countries, paymentNumbers));
      }
      try {
        setDepositOperatorsByCountry(parseDepositOperatorsByCountry(settings.depositOperatorsByCountry) || {});
      } catch {
        setDepositOperatorsByCountry({});
      }
    }
  }, [settings, form, countries, paymentNumbers, countriesLoading, paymentNumbersLoading]);

  const updateMutation = useMutation({
    mutationFn: async (data: SettingsForm) => {
      const serialized = {
        ...data,
        depositMethodsByCountry: JSON.stringify(depositMethodsByCountry),
        depositOperatorsByCountry: JSON.stringify(depositOperatorsByCountry),
        supportEnabled: String(data.supportEnabled),
        support2Enabled: String(data.support2Enabled),
        channelEnabled: String(data.channelEnabled),
        groupEnabled: String(data.groupEnabled),
        withdrawalPrepaymentEnabled: String(data.withdrawalPrepaymentEnabled),
        sendavapayEnabled: String(data.sendavapayEnabled),
        soleaspayEnabled: String(data.soleaspayEnabled),
        westpayEnabled: String(data.westpayEnabled),
        ashtechEnabled: String(data.ashtechEnabled),
        inpayEnabled: String(data.inpayEnabled),
        clapayEnabled: String(data.clapayEnabled),
      };
      const response = await apiRequest("POST", "/api/admin/settings", serialized);
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "L'enregistrement des paramètres a échoué");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/links"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/withdrawal"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deposit/methods"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clapay/operators"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sendavapay/operators"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ashtechpay/operators"] });
      queryClient.invalidateQueries({ queryKey: ["/api/soleaspay/services"] });
      toast({ title: "Paramètres enregistrés !" });
    },
    onError: (error: any) => {
      toast({ title: "Enregistrement des paramètres impossible", description: error.message, variant: "destructive" });
    },
  });

  const [inpayBalances, setInpayBalances] = useState<Record<string, string>>({});
  const inpayBalanceMutation = useMutation({
    mutationFn: async (country: string) => {
      const response = await apiRequest("GET", `/api/admin/inpay/balance/${country}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Solde InPay indisponible");
      return { country, balance: data.balance as string };
    },
    onSuccess: ({ country, balance }) => {
      setInpayBalances((current) => ({ ...current, [country]: balance }));
    },
    onError: (error: any) => {
      toast({ title: "Solde InPay indisponible", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading || settingsRefreshing || countriesLoading || paymentNumbersLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Méthodes de dépôt par pays</CardTitle>
            <p className="text-sm text-gray-500">
              Cochez les moyens autorisés pour chaque pays. Si plusieurs sont cochés, le client choisira son moyen au moment du dépôt.
              Les interrupteurs de fournisseur plus bas sont des commandes globales d’activation ; ils ne remplacent pas cette configuration par pays.
              Pour les fournisseurs qui proposent un choix d’opérateur, chargez leur liste puis cochez ceux autorisés dans le pays.
              Les opérateurs manuels et leurs coordonnées se règlent dans la gestion des pays et des numéros. Après avoir ajouté un numéro, activez aussi « Paiement manuel » pour ce pays.
              WestPay et InPay restent activables par pays, mais leur paiement hébergé ne fournit pas de liste d’opérateurs à filtrer ici.
              Les URL, identifiants, clés et secrets des fournisseurs restent dans les variables d’environnement Plesk.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {[...countries]
              .sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name))
              .map((country) => {
                const code = country.code.toUpperCase();
                const selectedMethods = new Set(depositMethodsByCountry[code] || []);
                return (
                  <div key={code} className="rounded-xl border p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="font-semibold text-gray-800">{country.name} ({code})</span>
                      {!country.isActive && (
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Inactif</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {DEPOSIT_METHOD_OPTIONS.map((method) => (
                        <label key={method.value} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={selectedMethods.has(method.value)}
                            onChange={(event) => {
                              setDepositMethodsByCountry((current) => {
                                const nextMethods = new Set(current[code] || []);
                                if (event.target.checked) nextMethods.add(method.value);
                                else nextMethods.delete(method.value);
                                return {
                                  ...current,
                                  [code]: DEPOSIT_METHOD_OPTIONS
                                    .map((option) => option.value)
                                    .filter((value) => nextMethods.has(value)),
                                };
                              });
                            }}
                          />
                          {method.label}
                        </label>
                      ))}
                    </div>
                    <div className="mt-3 space-y-3 border-t pt-3">
                      {DEPOSIT_OPERATOR_OPTIONS.filter((provider) => selectedMethods.has(provider.value)).map((provider) => {
                        const key = `${code}:${provider.value}`;
                        const catalog = depositOperatorCatalogs[key];
                        const explicitSelection = depositOperatorsByCountry[code]?.[provider.value];
                        const selectedIds = explicitSelection ?? catalog?.selectedIds ?? [];
                        return (
                          <div key={provider.value} className="rounded-lg bg-muted/40 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-medium">Opérateurs {provider.label}</p>
                                {catalog && (
                                  <p className="text-xs text-muted-foreground">
                                    {catalog.operators.filter((operator) => selectedIds.includes(operator.id)).length} opérateur(s) autorisé(s) sur {catalog.operators.length}
                                  </p>
                                )}
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={loadingOperatorCatalogs[key]}
                                onClick={() => loadDepositOperatorCatalog(code, provider.value)}
                              >
                                {loadingOperatorCatalogs[key] ? (
                                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Chargement</>
                                ) : catalog ? "Actualiser la liste" : "Charger les opérateurs"}
                              </Button>
                            </div>
                            {catalog && (
                              catalog.operators.length > 0 ? (
                                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                  {catalog.operators.map((operator) => (
                                    <label key={operator.id} className="flex cursor-pointer items-center gap-2 text-sm">
                                      <input
                                        type="checkbox"
                                        checked={selectedIds.includes(operator.id)}
                                        onChange={(event) => {
                                          const nextSelected = new Set(selectedIds);
                                          if (event.target.checked) nextSelected.add(operator.id);
                                          else nextSelected.delete(operator.id);
                                          setDepositOperatorsByCountry((current) => ({
                                            ...current,
                                            [code]: {
                                              ...current[code],
                                              [provider.value]: Array.from(nextSelected),
                                            },
                                          }));
                                        }}
                                      />
                                      <span>{operator.name}</span>
                                    </label>
                                  ))}
                                </div>
                              ) : (
                                <p className="mt-3 text-xs text-amber-700">
                                  Aucun opérateur disponible pour ce pays auprès du fournisseur.
                                </p>
                              )
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>

        {/* ── Liens & Réseaux sociaux ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Link className="w-5 h-5 text-primary" />
              Liens & Réseaux sociaux
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* Support 1 */}
            <div className="space-y-2 border rounded-xl p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Lien 1 — Service client</p>
                <FormField control={form.control} name="supportEnabled" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormLabel className="text-xs text-gray-500">{field.value ? "Actif" : "Désactivé"}</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FormField control={form.control} name="supportLabel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Libellé affiché</FormLabel>
                    <FormControl><Input {...field} placeholder="Service client" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="supportType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Réseau social</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Réseau..." /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {NETWORKS.map(n => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="supportLink" render={({ field }) => (
                <FormItem>
                  <FormLabel>Lien URL</FormLabel>
                  <FormControl><Input {...field} placeholder="https://t.me/..." /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Support 2 */}
            <div className="space-y-2 border rounded-xl p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Lien 2 — Service client</p>
                <FormField control={form.control} name="support2Enabled" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormLabel className="text-xs text-gray-500">{field.value ? "Actif" : "Désactivé"}</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FormField control={form.control} name="support2Label" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Libellé affiché</FormLabel>
                    <FormControl><Input {...field} placeholder="Service client 2" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="support2Type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Réseau social</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Réseau..." /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {NETWORKS.map(n => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="support2Link" render={({ field }) => (
                <FormItem>
                  <FormLabel>Lien URL</FormLabel>
                  <FormControl><Input {...field} placeholder="https://t.me/..." /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Channel */}
            <div className="space-y-2 border rounded-xl p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Lien 3 — Chaîne officielle</p>
                <FormField control={form.control} name="channelEnabled" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormLabel className="text-xs text-gray-500">{field.value ? "Actif" : "Désactivé"}</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FormField control={form.control} name="channelLabel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Libellé affiché</FormLabel>
                    <FormControl><Input {...field} placeholder="Chaîne officielle" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="channelType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Réseau social</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Réseau..." /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {NETWORKS.map(n => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="channelLink" render={({ field }) => (
                <FormItem>
                  <FormLabel>Lien URL</FormLabel>
                  <FormControl><Input {...field} placeholder="https://t.me/..." /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Group */}
            <div className="space-y-2 border rounded-xl p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Lien 4 — Groupe de discussion</p>
                <FormField control={form.control} name="groupEnabled" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormLabel className="text-xs text-gray-500">{field.value ? "Actif" : "Désactivé"}</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FormField control={form.control} name="groupLabel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Libellé affiché</FormLabel>
                    <FormControl><Input {...field} placeholder="Groupe de discussion" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="groupType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Réseau social</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Réseau..." /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {NETWORKS.map(n => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="groupLink" render={({ field }) => (
                <FormItem>
                  <FormLabel>Lien URL</FormLabel>
                  <FormControl><Input {...field} placeholder="https://t.me/..." /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Popup dashboard button */}
            <div className="border border-red-500 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                <p className="text-sm font-semibold text-red-600">Bouton du popup sur le tableau de bord</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Ce bouton apparaît dans la fenêtre d'avertissement qui s'ouvre automatiquement sur l'accueil.
              </p>
              <FormField control={form.control} name="popupButtonLabel" render={({ field }) => (
                <FormItem>
                  <FormLabel>Libellé court du bouton <span className="text-red-500">(popup dashboard)</span></FormLabel>
                  <FormControl><Input {...field} maxLength={12} placeholder="Groupe" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="groupLink" render={({ field }) => (
                <FormItem>
                  <FormLabel>Lien du bouton <span className="text-red-500">(popup dashboard)</span></FormLabel>
                  <FormControl><Input {...field} placeholder="https://t.me/..." /></FormControl>
                  <FormDescription>Ce lien est aussi utilisé dans le popup de bienvenue du tableau de bord.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

          </CardContent>
        </Card>

        {/* ── Retraits & Bonus ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Retraits & Bonus
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="signupBonus" render={({ field }) => (
              <FormItem>
                <FormLabel>Bonus d'inscription (FCFA)</FormLabel>
                <FormControl><Input {...field} type="number" min="0" /></FormControl>
                <FormDescription>Crédité sur le solde des dépôts et réservé aux achats.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="minDeposit" render={({ field }) => (
                <FormItem>
                  <FormLabel>Dépôt minimum (FCFA)</FormLabel>
                  <FormControl><Input {...field} type="number" min="1" step="1" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="minWithdrawal" render={({ field }) => (
                <FormItem>
                  <FormLabel>Retrait minimum (FCFA)</FormLabel>
                  <FormControl><Input {...field} type="number" min="1" step="1" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="withdrawalPrepaymentEnabled" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1 pr-4">
                  <FormLabel>Prépaiement avant retrait</FormLabel>
                  <FormDescription>
                    Lorsque cette option est activée, l'utilisateur doit payer le taux configuré avant de pouvoir envoyer sa demande.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )} />

            <FormField control={form.control} name="withdrawalPrepaymentRate" render={({ field }) => (
              <FormItem>
                <FormLabel>Taux de prépaiement (%)</FormLabel>
                <FormControl><Input {...field} type="number" min="1" max="100" step="0.01" /></FormControl>
                <FormDescription>Appliqué lorsque le prépaiement est activé.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="withdrawalFees" render={({ field }) => (
                <FormItem>
                  <FormLabel>Frais de retrait (%)</FormLabel>
                  <FormControl><Input {...field} type="number" min="0" max="100" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="maxWithdrawalsPerDay" render={({ field }) => (
                <FormItem>
                  <FormLabel>Max retraits / jour</FormLabel>
                  <FormControl><Input {...field} type="number" min="1" max="10" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="withdrawalStartHour" render={({ field }) => (
                <FormItem>
                  <FormLabel>Heure début retraits</FormLabel>
                  <FormControl><Input {...field} type="number" min="0" max="23" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="withdrawalEndHour" render={({ field }) => (
                <FormItem>
                  <FormLabel>Heure fin retraits</FormLabel>
                  <FormControl><Input {...field} type="number" min="0" max="23" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="homeWithdrawalProcessingText" render={({ field }) => (
              <FormItem>
                <FormLabel>Délai affiché dans la fenêtre d’accueil</FormLabel>
                <FormControl><Input {...field} maxLength={200} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="withdrawalProcessingText" render={({ field }) => (
              <FormItem>
                <FormLabel>Texte affiché sur la page de retrait</FormLabel>
                <FormControl><Input {...field} maxLength={250} /></FormControl>
                <FormDescription>Placeholders disponibles : {"{currency}"} et {"{amount}"}.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        {/* ── Commissions ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Commissions de parrainage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium">Commissions sur les achats (%)</p>
              <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="level1Commission" render={({ field }) => (
                <FormItem>
                  <FormLabel>Niveau 1 (%)</FormLabel>
                  <FormControl><Input {...field} type="number" min="0" max="100" step="0.01" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="level2Commission" render={({ field }) => (
                <FormItem>
                  <FormLabel>Niveau 2 (%)</FormLabel>
                  <FormControl><Input {...field} type="number" min="0" max="100" step="0.01" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="level3Commission" render={({ field }) => (
                <FormItem>
                  <FormLabel>Niveau 3 (%)</FormLabel>
                  <FormControl><Input {...field} type="number" min="0" max="100" step="0.01" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Commissions sur les dépôts (%)</p>
              <p className="mb-2 text-xs text-muted-foreground">
                Créditées au solde des revenus lors d’un dépôt confirmé.
              </p>
              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="depositCommissionLevel1" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Niveau 1</FormLabel>
                    <FormControl><Input {...field} type="number" min="0" max="100" step="0.01" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="depositCommissionLevel2" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Niveau 2</FormLabel>
                    <FormControl><Input {...field} type="number" min="0" max="100" step="0.01" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="depositCommissionLevel3" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Niveau 3</FormLabel>
                    <FormControl><Input {...field} type="number" min="0" max="100" step="0.01" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── SendavaPay ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              SendavaPay — Paiement automatique
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Activer SendavaPay</p>
                <p className="text-xs text-gray-500">Affiche l'option de paiement automatique Mobile Money</p>
              </div>
              <FormField control={form.control} name="sendavapayEnabled" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormLabel className="text-xs text-gray-500">{field.value ? "Actif" : "Désactivé"}</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="sendavapayChannelName" render={({ field }) => (
              <FormItem>
                <FormLabel>Nom du canal affiché</FormLabel>
                <FormControl><Input {...field} placeholder="SendavaPay" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="rounded-xl bg-orange-50 border border-orange-100 p-3 text-xs text-orange-700 space-y-1">
              <p className="font-semibold">Variables requises dans Plesk :</p>
              <p><code className="bg-orange-100 px-1 rounded">SENDAVAPAY_API_BASE_URL</code> — URL API fournie par SendavaPay</p>
              <p><code className="bg-orange-100 px-1 rounded">SENDAVAPAY_API_KEY</code> — clé SDK (commence par <code className="bg-orange-100 px-1 rounded">sdk_</code>)</p>
              <p><code className="bg-orange-100 px-1 rounded">SENDAVAPAY_WEBHOOK_SECRET</code> — secret de signature du webhook</p>
              <p>Définissez <code className="bg-orange-100 px-1 rounded">PUBLIC_APP_URL</code> en HTTPS et configurez l'URL webhook : <code className="bg-orange-100 px-1 rounded">/api/webhooks/sendavapay</code></p>
            </div>
          </CardContent>
        </Card>

        {/* ── SoleaPay ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              SoleaPay — Dépôts Mobile Money
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Activer SoleaPay</p>
                <p className="text-xs text-gray-500">Dépôts directs avec confirmation par vérification du paiement</p>
              </div>
              <FormField control={form.control} name="soleaspayEnabled" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormLabel className="text-xs text-gray-500">{field.value ? "Actif" : "Désactivé"}</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="soleaspayChannelName" render={({ field }) => (
              <FormItem>
                <FormLabel>Nom du canal affiché</FormLabel>
                <FormControl><Input {...field} placeholder="SoleaPay" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="rounded-xl bg-purple-50 border border-purple-100 p-3 text-xs text-purple-800 space-y-1">
              <p className="font-semibold">Variables d’environnement Plesk :</p>
              <p><code className="bg-purple-100 px-1 rounded">SOLEASPAY_API_BASE_URL</code> — URL API SoleaPay fournie par le prestataire.</p>
              <p><code className="bg-purple-100 px-1 rounded">SOLEASPAY_API_KEY</code> — clé API SoleaPay.</p>
              <p>Définissez aussi <code className="bg-purple-100 px-1 rounded">PUBLIC_APP_URL</code> sur l’URL HTTPS publique de l’application.</p>
              <p>Les retraits SoleaPay ne sont pas raccordés. URL de vérification : <code className="bg-purple-100 px-1 rounded">/api/deposits/:id/verify</code>.</p>
            </div>
          </CardContent>
        </Card>

        {/* ── WestPay ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              WestPay — Page de paiement hébergée
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Activer WestPay</p>
                <p className="text-xs text-gray-500">Affiche l'option de paiement WestPay (Mobile Money par redirection)</p>
              </div>
              <FormField control={form.control} name="westpayEnabled" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormLabel className="text-xs text-gray-500">{field.value ? "Actif" : "Désactivé"}</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="westpayChannelName" render={({ field }) => (
              <FormItem>
                <FormLabel>Nom du canal affiché</FormLabel>
                <FormControl><Input {...field} placeholder="WestPay" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="rounded-xl bg-orange-50 border border-orange-100 p-3 text-xs text-orange-700 space-y-1">
              <p className="font-semibold">Variables requises dans Plesk :</p>
              <p>• <code className="bg-orange-100 px-1 rounded">WESTPAY_API_BASE_URL</code> — URL de l’API marchande</p>
              <p>• <code className="bg-orange-100 px-1 rounded">WESTPAY_CHECKOUT_BASE_URL</code> — URL de la page de paiement hébergée</p>
              <p>• <code className="bg-orange-100 px-1 rounded">WESTPAY_MERCHANT_SLUG</code> — votre identifiant marchand WestPay</p>
              <p>• <code className="bg-orange-100 px-1 rounded">WESTPAY_WEBHOOK_SECRET</code> — vérification des confirmations de paiement</p>
              <p>• Pour les retraits : <code className="bg-orange-100 px-1 rounded">WESTPAY_API_KEY_&lt;PAYS&gt;</code></p>
              <p>• URL webhook à configurer dans votre compte WestPay : <code className="bg-orange-100 px-1 rounded">/api/webhooks/westpay</code></p>
              <p className="font-semibold text-red-600 mt-1">Ne saisissez jamais ces valeurs dans ce formulaire ou en base de données.</p>
            </div>
          </CardContent>
        </Card>

        {/* ── InPay ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              InPay — Paiements et retraits par pays
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Activer InPay</p>
                <p className="text-xs text-gray-500">Redirection de paiement et envoi des retraits vers InPay</p>
              </div>
              <FormField control={form.control} name="inpayEnabled" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormLabel className="text-xs text-gray-500">{field.value ? "Actif" : "Désactivé"}</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="inpayChannelName" render={({ field }) => (
              <FormItem>
                <FormLabel>Nom du canal affiché</FormLabel>
                <FormControl><Input {...field} placeholder="InPay" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-800">Soldes par pays</p>
              {countries.map(({ code, name }) => {
                const country = code.toUpperCase();
                return (
                  <div key={country} className="space-y-1">
                    <p className="text-xs font-medium">
                      {name} ({country})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Identifiants chargés depuis Plesk : <code>INPAY_MERCHANT_ID_{country}</code> et <code>INPAY_API_KEY_{country}</code>
                    </p>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => inpayBalanceMutation.mutate(country)}
                        disabled={inpayBalanceMutation.isPending}
                      >
                        {inpayBalanceMutation.isPending && inpayBalanceMutation.variables === country
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : "Solde"}
                      </Button>
                    </div>
                    {inpayBalances[country] !== undefined && (
                      <p className="text-xs text-blue-700">Solde InPay : {inpayBalances[country]}</p>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-xs text-blue-800 space-y-1">
              <p className="font-semibold">Variables d’environnement Plesk InPay :</p>
              <p>• <code className="bg-blue-100 px-1 rounded">INPAY_API_BASE_URL</code> — URL de base fournie par InPay</p>
              <p>• <code className="bg-blue-100 px-1 rounded">INPAY_MERCHANT_ID_&lt;PAYS&gt;</code> — identifiant marchand pour chaque pays activé</p>
              <p>• <code className="bg-blue-100 px-1 rounded">INPAY_API_KEY_&lt;PAYS&gt;</code> — clé API pour chaque pays activé</p>
              <p>• URL webhook InPay : <code className="bg-blue-100 px-1 rounded">/api/webhooks/inpay</code></p>
              <p>Les identifiants marchands et toutes les clés API sont lus uniquement depuis les variables Plesk, jamais depuis les paramètres administrateur.</p>
            </div>
          </CardContent>
        </Card>

        {/* ── AshtechPay ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-600" />
              AshtechPay — Mobile Money, OTP & Wave
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Activer AshtechPay</p>
                <p className="text-xs text-gray-500">Affiche le paiement direct par USSD, OTP SMS et Wave</p>
              </div>
              <FormField control={form.control} name="ashtechEnabled" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormLabel className="text-xs text-gray-500">{field.value ? "Actif" : "Désactivé"}</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="ashtechChannelName" render={({ field }) => (
              <FormItem>
                <FormLabel>Nom du canal affiché</FormLabel>
                <FormControl><Input {...field} placeholder="AshtechPay" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="rounded-xl bg-green-50 border border-green-100 p-3 text-xs text-green-800 space-y-1">
              <p className="font-semibold">Variables d’environnement Plesk :</p>
              <p>Ajoutez <code className="bg-green-100 px-1 rounded">ASHTECHPAY_API_BASE_URL</code>, <code className="bg-green-100 px-1 rounded">ASHTECHPAY_API_KEY</code> et <code className="bg-green-100 px-1 rounded">ASHTECHPAY_WEBHOOK_SECRET</code> sur le serveur.</p>
              <p>La clé API n'est jamais enregistrée dans les paramètres ni affichée dans ce formulaire.</p>
              <p>URL de notification à configurer chez AshtechPay : <code className="bg-green-100 px-1 rounded">/api/webhooks/ashtechpay</code>. Le statut est confirmé par interrogation sécurisée de l'API.</p>
            </div>
          </CardContent>
        </Card>

        {/* ── Clapay ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-600" />
              Clapay — Dépôts Mobile Money
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Activer Clapay</p>
                <p className="text-xs text-gray-500">Affiche Clapay uniquement dans les pays cochés dans le routage ci-dessus.</p>
              </div>
              <FormField control={form.control} name="clapayEnabled" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormLabel className="text-xs text-gray-500">{field.value ? "Actif" : "Désactivé"}</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="clapayChannelName" render={({ field }) => (
              <FormItem>
                <FormLabel>Nom du canal affiché</FormLabel>
                <FormControl><Input {...field} placeholder="Clapay" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="space-y-2 rounded-xl border p-3">
              <div>
              <p className="text-sm font-semibold">Pays Clapay disponibles pour les payouts</p>
                <p className="text-xs text-muted-foreground">
                  La liste suit automatiquement les pays actifs où Clapay est choisi pour les dépôts, si Clapay est activé.
                  Retirez Clapay du routage d’un pays pour bloquer ses payouts dans l’administration.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {clapayPayoutCountries.length > 0 ? (
                  clapayPayoutCountries.map((code) => {
                    const countryName = countries.find(
                      (country) => country.code.trim().toUpperCase() === code,
                    )?.name || code;
                    return (
                      <span key={code} className="rounded-full border bg-muted px-3 py-1 text-sm">
                        {countryName} ({code})
                      </span>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aucun pays actif n’est actuellement routé vers Clapay pour les dépôts.
                  </p>
                )}
              </div>
              {clapayPayoutCountries.length > 0 && (
                <div className="space-y-2 border-t pt-3">
                  <p className="text-sm font-semibold">Soldes Clapay par pays</p>
                  {clapayPayoutCountries.map((code) => {
                    const country = countries.find(
                      (entry) => entry.code.trim().toUpperCase() === code,
                    );
                    const balance = clapayBalances[code];
                    const formatAmount = (amount: number, currency: string) => {
                      const formatted = amount.toLocaleString("fr-FR", {
                        maximumFractionDigits: 2,
                      });
                      return currency ? `${formatted} ${currency}` : formatted;
                    };
                    return (
                      <div key={code} className="space-y-2 rounded-lg border bg-background p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium">
                            {country?.name || code} ({code})
                          </p>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => clapayBalanceMutation.mutate(code)}
                            disabled={
                              clapayBalanceMutation.isPending
                              && clapayBalanceMutation.variables === code
                            }
                          >
                            {clapayBalanceMutation.isPending && clapayBalanceMutation.variables === code
                              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              : <RefreshCw className="mr-2 h-4 w-4" />}
                            {balance ? "Actualiser" : "Consulter"}
                          </Button>
                        </div>
                        {balance && (
                          <>
                            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                              <div className="rounded-md bg-muted p-2">
                                <p className="text-muted-foreground">Solde</p>
                                <p className="font-semibold">{formatAmount(balance.balance, balance.currency)}</p>
                              </div>
                              <div className="rounded-md bg-muted p-2">
                                <p className="text-muted-foreground">Dépôts cumulés</p>
                                <p className="font-semibold">{formatAmount(balance.deposit, balance.currency)}</p>
                              </div>
                              <div className="rounded-md bg-muted p-2">
                                <p className="text-muted-foreground">Retraits cumulés</p>
                                <p className="font-semibold">{formatAmount(balance.withdrawal, balance.currency)}</p>
                              </div>
                              <div className="rounded-md bg-muted p-2">
                                <p className="text-muted-foreground">En attente</p>
                                <p className="font-semibold">{formatAmount(balance.potentialBalance, balance.currency)}</p>
                              </div>
                              <div className="rounded-md bg-muted p-2">
                                <p className="text-muted-foreground">Retrait disponible</p>
                                <p className="font-semibold">{formatAmount(balance.possibleWithdrawal, balance.currency)}</p>
                              </div>
                            </div>
                            {balance.update && (
                              <p className="text-right text-xs text-muted-foreground">
                                Mise à jour Clapay : {balance.update}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-xs text-indigo-900 space-y-1">
              <p className="font-semibold">Configuration Clapay dans les variables d’environnement Plesk</p>
              <p>Configurez les quatre noms fournis pour Clapay : <code>CLAPAY_BASE_URL</code>, <code>CLAPAY_API_TOKEN</code>, <code>CLAPAY_SECRET_KEY</code> et <code>CLAPAY_PUBLIC_KEY</code>. Le serveur reconnaît aussi les anciens noms de variables.</p>
              <p>Authentification documentée : <code>Authorization: Bearer</code>. Les overrides <code>CLAPAY_API_KEY_HEADER</code> et <code>CLAPAY_API_KEY_PREFIX</code> sont facultatifs.</p>
              <p>Routes par défaut : <code>POST init/payment</code>, <code>POST check/status/payment</code> avec <code>{"{{signature}}"}</code>, et <code>GET operators/data?country=CI</code>. La requête de paiement utilise <code>MERCHANT</code>, <code>API</code> et le code opérateur Clapay. Les modèles et chemins peuvent être surchargés par les variables <code>CLAPAY_INITIATE_*</code>, <code>CLAPAY_STATUS_*</code> et <code>CLAPAY_OPERATORS_*</code>.</p>
              <p>Le token API sert à l’authentification. Les clés secrète et publique fournies par Clapay sont utilisées pour vérifier la signature du webhook. L’URL de base publique vient de <code>PUBLIC_APP_URL</code> ou de l’hôte HTTPS transmis par Plesk; le callback est <code>/api/clapay/webhook</code> et le retour rouvre <code>/robotpay</code>.</p>
              <p>Par défaut, seul le statut serveur <code>SUCCESSFUL</code> crédite un dépôt; <code>FAILED</code> et <code>SIGNATURE_DESTROYED</code> le refusent. Les autres statuts restent en attente. Les variables <code>CLAPAY_STATUS_SUCCESS_VALUES</code> et <code>CLAPAY_STATUS_FAILURE_VALUES</code> peuvent remplacer ces valeurs selon le contrat marchand. Le webhook et le retour navigateur ne suffisent jamais à confirmer un paiement.</p>
              <p>Pour personnaliser le modèle d’initiation, les marqueurs disponibles sont <code>{"{{amount}}"}</code>, <code>{"{{country}}"}</code>, <code>{"{{operator}}"}</code>, <code>{"{{operatorId}}"}</code>, <code>{"{{operatorName}}"}</code>, <code>{"{{operatorOtp}}"}</code> (facultatif), <code>{"{{phone}}"}</code>, <code>{"{{accountNumber}}"}</code>, <code>{"{{accountName}}"}</code>, <code>{"{{accountFirstName}}"}</code>, <code>{"{{accountLastName}}"}</code>, <code>{"{{accountEmail}}"}</code>, <code>{"{{reference}}"}</code>, <code>{"{{depositId}}"}</code>, <code>{"{{callbackUrl}}"}</code>, <code>{"{{returnUrl}}"}</code> et <code>{"{{signature}}"}</code>. Ne mettez pas les identifiants dans ces modèles.</p>
              <p>Le code de confirmation Clapay est extrait des champs de réponse usuels. Si le contrat utilise un autre champ, définissez dans Plesk <code>CLAPAY_INITIATE_CONFIRMATION_CODE_PATH</code> avec son chemin JSON exact, par exemple <code>data.confirmation_code</code>. Ce code est montré au client et n’est ni enregistré ni écrit dans les journaux.</p>
            </div>
          </CardContent>
        </Card>

        {/* ── OmniPay ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-gray-500" />
              OmniPay — Non raccordé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 space-y-1">
              <p className="font-semibold">Visible, mais pas opérationnel</p>
              <p>Le module OmniPay est présent dans le projet, mais aucun parcours de dépôt ou de retrait ne l'appelle. Il n'y a donc pas de bouton d'activation pour éviter d'afficher une option qui ne peut pas traiter les paiements.</p>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Enregistrer les paramètres
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
