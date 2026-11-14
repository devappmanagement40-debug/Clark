import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type Country = { code: string; name: string; currency?: string };

type ClapayCountryBalance = {
  country: string;
  name: string;
  currency: string;
  balance: number;
  deposit: number;
  withdrawal: number;
  potentialBalance: number;
  possibleWithdrawal: number;
  update?: string;
};

type Props = {
  countries: Country[];
  countryCodes: string[];
  loading?: boolean;
};

function formatAmount(amount: number, currency: string) {
  const formatted = amount.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
  return currency ? `${formatted} ${currency}` : formatted;
}

export default function AdminClapayCountryBalances({
  countries,
  countryCodes,
  loading = false,
}: Props) {
  const { toast } = useToast();
  const [balances, setBalances] = useState<Record<string, ClapayCountryBalance>>({});
  const balanceMutation = useMutation({
    mutationFn: async (country: string) => {
      const response = await apiRequest("GET", `/api/admin/clapay/balance/${country}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Solde Clapay indisponible");
      }
      return data as ClapayCountryBalance;
    },
    onSuccess: (balance) => {
      setBalances((current) => ({ ...current, [balance.country]: balance }));
    },
    onError: (error: Error) => {
      toast({
        title: "Solde Clapay indisponible",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Soldes Clapay par pays</CardTitle>
        <p className="text-sm text-muted-foreground">
          Consultez le solde des pays affectés à Clapay pour les dépôts.
          Cette consultation reste disponible même si les paiements Clapay sont désactivés.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Chargement des pays…
          </div>
        ) : countryCodes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun pays actif n’est affecté à Clapay. Activez Clapay dans « Méthodes de dépôt par pays », puis enregistrez les paramètres.
          </p>
        ) : (
          countryCodes.map((code) => {
            const country = countries.find(
              (entry) => entry.code.trim().toUpperCase() === code,
            );
            const balance = balances[code];
            const isRefreshing =
              balanceMutation.isPending && balanceMutation.variables === code;

            return (
              <section key={code} className="space-y-3 rounded-lg border bg-background p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">
                    {country?.name || balance?.name || code} ({code})
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => balanceMutation.mutate(code)}
                    disabled={isRefreshing}
                  >
                    {isRefreshing
                      ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      : <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />}
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
              </section>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
