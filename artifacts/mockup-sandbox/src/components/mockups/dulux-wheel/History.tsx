import { ArrowLeft } from "lucide-react";
import "./_group.css";
import "./wheel.css";

export function WheelHistoryPreview({ onBack = () => undefined }: { onBack?: () => void }) {
  return (
    <main className="wheel-reward-history-page">
      <header className="wheel-reward-history-header">
        <button type="button" className="wheel-reward-history-back" aria-label="Retour à la roue" onClick={onBack}>
          <ArrowLeft size={24} aria-hidden="true" />
        </button>
        <h1>Historique des récompenses</h1>
      </header>
      <div className="wheel-reward-history-empty" role="status">
        <img src="/__mockup/images/wheel-history-empty.png" alt="Aucune récompense enregistrée" />
      </div>
    </main>
  );
}

export default function WheelRewardHistoryPreview() {
  return <WheelHistoryPreview />;
}
