import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import emptyHistoryIllustration from "@/assets/images/wheel-history-empty.png";
import "./wheel-history.css";

interface WheelRewardHistoryRecord {
  id: number;
  prizeName: string;
  prizeValue: string;
  status: string;
  createdAt: string;
}

function formatRewardDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getRewardStatusLabel(status: string) {
  switch (status) {
    case "delivered":
      return "Récompense remise";
    case "cancelled":
      return "Annulée";
    default:
      return "En attente";
  }
}

export default function WheelRewardHistoryPage() {
  const [, navigate] = useLocation();
  const {
    data: records = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<WheelRewardHistoryRecord[]>({
    queryKey: ["/api/wheel/rewards/history"],
  });

  return (
    <main className="wheel-reward-history-page">
      <header className="wheel-reward-history-header">
        <button
          type="button"
          className="wheel-reward-history-back"
          aria-label="Retour à la roue"
          onClick={() => navigate("/my-page/wheel")}
        >
          <ArrowLeft size={24} aria-hidden="true" />
        </button>
        <h1>Historique des récompenses</h1>
      </header>

      {isLoading ? (
        <div className="wheel-reward-history-state" role="status" aria-label="Chargement de l’historique">
          <Loader2 className="wheel-reward-history-spinner" aria-hidden="true" />
        </div>
      ) : isError ? (
        <div className="wheel-reward-history-state wheel-reward-history-error" role="alert">
          <span>Impossible de charger l’historique.</span>
          <button type="button" onClick={() => void refetch()}>Réessayer</button>
        </div>
      ) : records.length === 0 ? (
        <div className="wheel-reward-history-empty" role="status">
          <img src={emptyHistoryIllustration} alt="Aucune récompense enregistrée" />
        </div>
      ) : (
        <section className="wheel-reward-history-list" aria-label="Récompenses reçues">
          {records.map((record) => (
            <article className="wheel-reward-history-card" key={record.id}>
              <div className="wheel-reward-history-row">
                <strong className="wheel-reward-history-name">{record.prizeName}</strong>
                <time dateTime={record.createdAt}>{formatRewardDate(record.createdAt)}</time>
              </div>
              <div className="wheel-reward-history-row wheel-reward-history-value-row">
                <strong>{record.prizeValue}</strong>
                <span>{getRewardStatusLabel(record.status)}</span>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
