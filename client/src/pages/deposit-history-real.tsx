import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Receipt, RotateCw } from "lucide-react";
import { Link } from "wouter";
import { getCountryByCode } from "@/lib/countries";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPublicTransactionId } from "@shared/public-transaction-id";

interface Deposit {
  id: number;
  amount: string | number;
  status: string;
  createdAt: string;
  publicReference?: string;
}

function formatDepositDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date indisponible";

  const datePart = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(date);

  return `${datePart} ${timePart}`;
}

function getDepositStatus(status: string) {
  switch (status.toLowerCase()) {
    case "approved":
    case "success":
    case "completed":
      return {
        label: "Confirmée",
        className: "border-emerald-700/30 bg-emerald-50 text-emerald-800",
      };
    case "pending":
    case "processing":
    case "initiated":
      return {
        label: "En cours",
        className: "border-[#1947b8]/35 bg-[#edf2ff] text-[#12358f]",
      };
    case "rejected":
    case "failed":
    case "cancelled":
      return {
        label: "Refusée",
        className: "border-red-700/30 bg-red-50 text-red-800",
      };
    default:
      return {
        label: status || "Statut indisponible",
        className: "border-neutral-300 bg-neutral-100 text-neutral-700",
      };
  }
}

export default function DepositHistoryRealPage() {
  const { user } = useAuth();
  const countryInfo = user ? getCountryByCode(user.country) : null;
  const currency = countryInfo?.currency || "FCFA";

  const {
    data: deposits = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery<Deposit[]>({
    queryKey: ["/api/deposits/history"],
  });

  return (
    <main className="min-h-[100dvh] bg-white text-[#171717]">
      <div className="mx-auto min-h-[100dvh] w-full max-w-[520px] bg-white">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-center border-b border-neutral-200 bg-white px-16">
          <Link
            href="/deposit"
            aria-label="Retour à la recharge"
            className="absolute left-3 grid h-10 w-10 place-items-center rounded-xl border-2 border-[#171717] bg-white text-[#1947b8] shadow-[0_2px_0_#171717] transition active:translate-y-0.5 active:shadow-none"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
          </Link>
          <h1 className="text-center text-lg font-extrabold tracking-tight">
            Historique des recharges
          </h1>
        </header>

        <section className="space-y-3 px-4 pb-8 pt-4" aria-label="Liste des recharges">
        {isLoading ? (
          Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="rounded-xl border-2 border-neutral-200 bg-white p-4"
              aria-hidden="true"
            >
              <Skeleton className="h-5 w-3/5" />
              <Skeleton className="mt-3 h-4 w-2/5" />
              <Skeleton className="mt-4 h-4 w-full" />
            </div>
          ))
        ) : isError ? (
          <div className="rounded-xl border-2 border-[#171717] bg-white p-5 text-center shadow-[0_3px_0_#171717]">
            <p className="font-semibold text-neutral-900">Impossible de charger l’historique.</p>
            <p className="mt-1 text-sm text-neutral-600">Vérifiez votre connexion puis réessayez.</p>
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border-2 border-[#171717] bg-[#1947b8] px-4 text-sm font-bold text-white shadow-[0_2px_0_#171717] transition active:translate-y-0.5 active:shadow-none disabled:opacity-60"
            >
              <RotateCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} aria-hidden="true" />
              Réessayer
            </button>
          </div>
        ) : deposits.length === 0 ? (
          <div className="rounded-xl border-2 border-[#171717] bg-white px-5 py-9 text-center shadow-[0_3px_0_#171717]">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-[#1947b8]/30 bg-[#edf2ff] text-[#1947b8]">
              <Receipt className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="mt-3 font-bold text-neutral-900">Aucune recharge pour le moment</p>
            <p className="mt-1 text-sm text-neutral-600">Vos opérations apparaîtront ici.</p>
          </div>
        ) : (
          deposits.map((deposit) => {
            const publicId = deposit.publicReference || formatPublicTransactionId("D", deposit.id);
            const status = getDepositStatus(deposit.status);
            const amount = Number(deposit.amount);
            const formattedAmount = Number.isFinite(amount)
              ? new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount)
              : "—";

            return (
              <article
                key={deposit.id}
                className="rounded-xl border-2 border-[#171717] border-l-[5px] border-l-[#1947b8] bg-white p-4 shadow-[0_3px_0_#171717]"
                data-testid={`deposit-item-${deposit.id}`}
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <p className="min-w-0 truncate text-sm font-bold tracking-wide text-neutral-900" title={publicId}>
                    {publicId}
                  </p>
                  <p className="shrink-0 text-sm font-extrabold tabular-nums text-neutral-900">
                    {currency} {formattedAmount}
                  </p>
                </div>

                <p className="mt-2 text-sm font-medium text-neutral-600">
                  Recharge Mobile Money
                </p>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-dashed border-neutral-300 pt-3">
                  <time
                    className="text-xs font-medium tabular-nums text-neutral-500"
                    dateTime={deposit.createdAt}
                  >
                    {formatDepositDate(deposit.createdAt)}
                  </time>
                  <span className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs font-bold ${status.className}`}>
                    {status.label}
                  </span>
                </div>
              </article>
            );
          })
        )}
        </section>
      </div>
    </main>
  );
}
