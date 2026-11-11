import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Loader2, RefreshCw, Send } from "lucide-react";
import type { ClapayPayout } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient, withProcessingIndicator } from "@/lib/queryClient";
import { parseClapayPayoutCountries } from "@shared/clapay-payout-countries";

type AdminCountry = { code: string; name: string; isActive: boolean };

const EMPTY_COUNTRIES: AdminCountry[] = [];

type PayoutOptions = {
  operators: Array<{ id: string; name: string; phonePrefixes?: string[] }>;
};

type PayoutRow = Pick<
  ClapayPayout,
  | "id"
  | "transactionId"
  | "country"
  | "amount"
  | "recipientName"
  | "recipientPhone"
  | "operatorCode"
  | "operatorName"
  | "status"
  | "providerStatus"
  | "message"
  | "createdAt"
  | "updatedAt"
  | "processedAt"
> & { canCheckStatus: boolean };

type PayoutResponse = {
  payout: PayoutRow;
  reused?: boolean;
  message?: string;
};

function statusLabel(status: string) {
  switch (status) {
    case "initiating":
      return "Envoi en cours";
    case "processing":
      return "À confirmer";
    case "approved":
      return "Confirmé";
    case "rejected":
      return "Refusé";
    case "failed":
      return "Échec d’initiation";
    default:
      return status;
  }
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "approved") return "default";
  if (status === "rejected" || status === "failed") return "destructive";
  return "secondary";
}

async function responseJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof data?.message === "string" ? data.message : `Erreur HTTP ${response.status}`;
    throw Object.assign(new Error(message), { responseData: data, status: response.status });
  }
  return data as T;
}

export default function AdminClapayPayouts() {
  const { toast } = useToast();
  const [country, setCountry] = useState("");
  const [operatorCode, setOperatorCode] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  const { data: adminSettings, isLoading: settingsLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/settings"],
  });
  const { data: countries = EMPTY_COUNTRIES, isLoading: countriesLoading } = useQuery<AdminCountry[]>({
    queryKey: ["/api/admin/countries"],
  });
  const configuredCountryCodes = useMemo(() => {
    if (!adminSettings) return [];
    try {
      return parseClapayPayoutCountries(adminSettings.clapayPayoutCountries);
    } catch {
      return [];
    }
  }, [adminSettings]);
  const availableCountries = useMemo(() => {
    const byCode = new Map(countries.map((entry) => [entry.code.toUpperCase(), entry]));
    return configuredCountryCodes
      .map((code) => byCode.get(code))
      .filter((entry): entry is AdminCountry => Boolean(entry?.isActive));
  }, [countries, configuredCountryCodes]);

  useEffect(() => {
    if (!availableCountries.some((entry) => entry.code.toUpperCase() === country)) {
      setCountry(availableCountries[0]?.code.toUpperCase() || "");
      setOperatorCode("");
      setConfirmed(false);
    }
  }, [availableCountries, country]);

  const optionsQuery = useQuery<PayoutOptions>({
    queryKey: ["/api/admin/clapay/payout-options", country],
    queryFn: async () => responseJson(await fetch(
      `/api/admin/clapay/payout-options/${country}`,
      { credentials: "include" },
    )),
    enabled: availableCountries.some((entry) => entry.code.toUpperCase() === country),
  });
  const payoutsQuery = useQuery<PayoutRow[]>({
    queryKey: ["/api/admin/clapay/payouts"],
    queryFn: async () => responseJson(await fetch("/api/admin/clapay/payouts", { credentials: "include" })),
    refetchInterval: 30_000,
  });

  const selectedOperator = useMemo(
    () => optionsQuery.data?.operators.find((operator) => operator.id === operatorCode),
    [optionsQuery.data?.operators, operatorCode],
  );
  const numericAmount = Number(amount);
  const amountIsValid = Number.isSafeInteger(numericAmount) && numericAmount >= 10;

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/clapay/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          idempotencyKey,
          country,
          amount: numericAmount,
          recipientName,
          phone,
          email,
          operatorCode,
          operatorName: selectedOperator?.name,
        }),
      });
      return responseJson<PayoutResponse>(response);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clapay/payouts"] });
      toast({
        title: result.reused ? "Référence existante" : "Payout transmis",
        description: result.message || "Le statut sera confirmé par Clapay.",
      });
      setRecipientName("");
      setPhone("");
      setEmail("");
      setAmount("");
      setConfirmed(false);
      setIdempotencyKey(crypto.randomUUID());
    },
    onError: (error: Error & { responseData?: { payout?: PayoutRow } }) => {
      if (error.responseData?.payout) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/clapay/payouts"] });
      }
      toast({ title: "Payout non envoyé", description: error.message, variant: "destructive" });
    },
  });

  const checkMutation = useMutation({
    mutationFn: async (id: number) => responseJson<{ payout: PayoutRow }>(await fetch(
      `/api/admin/clapay/payouts/${id}/check`,
      { method: "POST", credentials: "include" },
    )),
    onSuccess: ({ payout }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clapay/payouts"] });
      toast({ title: `Statut Clapay : ${statusLabel(payout.status)}` });
    },
    onError: (error: Error) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clapay/payouts"] });
      toast({ title: "Vérification impossible", description: error.message, variant: "destructive" });
    },
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!country || !selectedOperator || !amountIsValid || !confirmed) return;
    createMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Envoyer un payout Clapay</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-5 flex gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
            <p>
              Ce formulaire envoie un transfert réel. En cas de délai dépassé ou de statut incertain,
              vérifiez l’historique et ne soumettez pas un nouveau payout identique.
            </p>
          </div>

          <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
            <label className="space-y-1.5 text-sm font-medium" htmlFor="clapay-payout-country">
              Pays
              <select
                id="clapay-payout-country"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={country}
                onChange={(event) => {
                  setCountry(event.target.value);
                  setOperatorCode("");
                  setConfirmed(false);
                }}
                disabled={!availableCountries.length}
                required
              >
                {!availableCountries.length && <option value="">Aucun pays Clapay autorisé</option>}
                {availableCountries.map((entry) => (
                  <option key={entry.code} value={entry.code.toUpperCase()}>{entry.name}</option>
                ))}
              </select>
            </label>

            {!availableCountries.length && !settingsLoading && !countriesLoading && (
              <p className="text-sm text-amber-700 md:col-span-2">
                Aucun pays actif n’est autorisé pour les retraits Clapay. Configurez la liste dans Paramètres → Clapay.
              </p>
            )}

            <label className="space-y-1.5 text-sm font-medium" htmlFor="clapay-payout-operator">
              Opérateur mobile
              <select
                id="clapay-payout-operator"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                value={operatorCode}
                onChange={(event) => setOperatorCode(event.target.value)}
                disabled={optionsQuery.isLoading || !optionsQuery.data?.operators.length}
                required
              >
                <option value="">Choisir un opérateur</option>
                {optionsQuery.data?.operators.map((operator) => (
                  <option key={operator.id} value={operator.id}>{operator.name}</option>
                ))}
              </select>
            </label>

            {optionsQuery.isError && (
              <p className="text-sm text-destructive md:col-span-2">
                {(optionsQuery.error as Error).message}
              </p>
            )}
            {optionsQuery.data && (
              <p className="text-xs text-muted-foreground md:col-span-2">
                Les opérateurs disponibles pour ce pays sont chargés depuis Clapay.
              </p>
            )}

            <label className="space-y-1.5 text-sm font-medium" htmlFor="clapay-payout-name">
              Nom du bénéficiaire
              <Input
                id="clapay-payout-name"
                value={recipientName}
                onChange={(event) => setRecipientName(event.target.value)}
                autoComplete="off"
                maxLength={120}
                required
              />
            </label>

            <label className="space-y-1.5 text-sm font-medium" htmlFor="clapay-payout-phone">
              Téléphone du bénéficiaire
              <Input
                id="clapay-payout-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Numéro local ou international"
                autoComplete="off"
                maxLength={32}
                required
              />
            </label>

            <label className="space-y-1.5 text-sm font-medium" htmlFor="clapay-payout-amount">
              Montant (FCFA)
              <Input
                id="clapay-payout-amount"
                type="number"
                min={10}
                step={1}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
            </label>

            <label className="space-y-1.5 text-sm font-medium" htmlFor="clapay-payout-email">
              E-mail bénéficiaire (facultatif)
              <Input
                id="clapay-payout-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="off"
                maxLength={254}
              />
            </label>

            <label className="flex items-start gap-2 text-sm md:col-span-2">
              <input
                type="checkbox"
                className="mt-1"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                required
              />
              <span>Je confirme le pays, l’opérateur, le montant et le numéro du bénéficiaire avant l’envoi.</span>
            </label>

            <div className="md:col-span-2">
              <Button
                type="submit"
                disabled={
                  !country
                  || createMutation.isPending
                  || optionsQuery.isLoading
                  || !selectedOperator
                  || !amountIsValid
                  || !recipientName.trim()
                  || !phone.trim()
                  || !confirmed
                }
              >
                {createMutation.isPending
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  : <Send className="mr-2 h-4 w-4" aria-hidden="true" />}
                Confirmer et envoyer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Historique Clapay</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void withProcessingIndicator(async () => {
                await payoutsQuery.refetch();
              });
            }}
            disabled={payoutsQuery.isFetching}
          >
            {payoutsQuery.isFetching
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              : <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />}
            Actualiser
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {payoutsQuery.isError && (
            <p className="text-sm text-destructive">{(payoutsQuery.error as Error).message}</p>
          )}
          {payoutsQuery.isLoading && <p className="text-sm text-muted-foreground">Chargement de l’historique…</p>}
          {!payoutsQuery.isLoading && !payoutsQuery.isError && !payoutsQuery.data?.length && (
            <p className="text-sm text-muted-foreground">Aucun payout Clapay enregistré.</p>
          )}
          {payoutsQuery.data?.map((payout) => (
            <div key={payout.id} className="rounded-md border p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={statusVariant(payout.status)}>{statusLabel(payout.status)}</Badge>
                    {payout.providerStatus && (
                      <span className="text-xs text-muted-foreground">{payout.providerStatus}</span>
                    )}
                    <span className="text-sm font-semibold">{payout.amount.toLocaleString("fr-FR")} FCFA</span>
                  </div>
                  <p className="text-sm">{payout.recipientName} · {payout.recipientPhone}</p>
                  <p className="text-xs text-muted-foreground">
                    {countries.find((entry) => entry.code.toUpperCase() === payout.country.toUpperCase())?.name
                      || payout.country} · {payout.operatorName}
                    {" · "}{new Date(payout.createdAt).toLocaleString("fr-FR")}
                  </p>
                  <p className="break-all text-xs text-muted-foreground" title={payout.transactionId}>
                    Référence : {payout.transactionId}
                  </p>
                  {payout.message && (
                    <p className="text-sm text-amber-700 dark:text-amber-400">{payout.message}</p>
                  )}
                </div>
                {payout.canCheckStatus && !["approved", "rejected", "failed"].includes(payout.status) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => checkMutation.mutate(payout.id)}
                    disabled={checkMutation.isPending}
                  >
                    {checkMutation.isPending && checkMutation.variables === payout.id
                      ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      : <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />}
                    Vérifier le statut
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}