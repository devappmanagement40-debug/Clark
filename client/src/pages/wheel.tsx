import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Clock3, Gift, History, Sparkles } from "lucide-react";
import "./wheel.css";

const wheelSlices = [
  { label: "777", tone: "cream" },
  { label: "2777", tone: "sand" },
  { label: "7777", tone: "cream" },
  { label: "27777", tone: "sand" },
  { label: "77777", tone: "cream" },
  { label: "37777", tone: "sand" },
  { label: "97777", tone: "cream" },
  { label: "EXEMPLE", tone: "sand" },
];

function polarPoint(cx: number, cy: number, radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
}

function slicePath(index: number) {
  const startAngle = index * 45;
  const endAngle = startAngle + 45;
  const start = polarPoint(150, 150, 127, startAngle);
  const end = polarPoint(150, 150, 127, endAngle);
  return `M 150 150 L ${start.x} ${start.y} A 127 127 0 0 1 ${end.x} ${end.y} Z`;
}

function WheelIllustration() {
  return (
    <div className="wheel-stage" aria-label="Roue décorative, exemples de segments non configurés">
      <div className="wheel-pedestal" aria-hidden="true" />
      <div className="wheel-rim">
        <div className="wheel-lights" aria-hidden="true" />
        <svg className="wheel-face" viewBox="0 0 300 300" role="img" aria-label="Segments illustratifs, aucun lot configuré">
          {wheelSlices.map((slice, index) => {
            const angle = index * 45 + 22.5;
            const position = polarPoint(150, 150, 83, angle);
            return (
              <g key={slice.label + index}>
                <path d={slicePath(index)} className={`wheel-slice wheel-slice-${slice.tone}`} />
                <text
                  x={position.x}
                  y={position.y}
                  className="wheel-label"
                  transform={`rotate(${angle}, ${position.x}, ${position.y})`}
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {slice.label}
                </text>
              </g>
            );
          })}
          <circle cx="150" cy="150" r="20" className="wheel-hub" />
          <text x="150" y="154" className="wheel-hub-label" textAnchor="middle">DT</text>
        </svg>
        <div className="wheel-pointer" aria-hidden="true" />
      </div>
    </div>
  );
}

export default function WheelPage() {
  const [, navigate] = useLocation();
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <main className="wheel-page">
      <div className="wheel-sky" aria-hidden="true" />
      <button
        type="button"
        className="wheel-back"
        aria-label="Retour à l’accueil"
        onClick={() => navigate("/my-page/home")}
      >
        <ArrowLeft size={23} aria-hidden="true" />
      </button>

      <button
        type="button"
        className={`wheel-history-tab ${historyOpen ? "is-open" : ""}`}
        aria-expanded={historyOpen}
        aria-controls="wheel-history-panel"
        onClick={() => setHistoryOpen((open) => !open)}
      >
        <History size={16} aria-hidden="true" />
        <span>Historique</span>
      </button>

      <div className="wheel-content">
        <header className="wheel-heading">
          <p className="wheel-eyebrow"><Sparkles size={14} aria-hidden="true" /> ÉDITION ÉVÉNEMENT</p>
          <h1>Grand Tirage Chanceux</h1>
          <p className="wheel-good-luck">Bonne Chance</p>
          <p className="wheel-keep-going">Continuez à rouler !</p>
        </header>

        <div className="wheel-ticker" aria-label="Informations sur l’événement">
          <div className="wheel-ticker-track">
            <span>Un événement festif vous attend</span><i />
            <span>Les détails seront bientôt dévoilés</span><i />
            <span>Les détails seront bientôt dévoilés</span><i />
          </div>
        </div>

        <WheelIllustration />

        <div className="wheel-spins" aria-label="Nombre de tirages restants : 0">
          <Clock3 size={14} aria-hidden="true" />
          <span>Nombre de tirages restants : <strong>0</strong></span>
        </div>
        <button
          type="button"
          className="wheel-draw-button"
          disabled
          aria-describedby="wheel-disabled-note"
        >
          <span>Lancer le tirage</span>
          <span className="wheel-button-mark" aria-hidden="true"><Gift size={18} /></span>
        </button>
        <p className="wheel-disabled-note" id="wheel-disabled-note" role="status">
          Le tirage sera activé après configuration.
        </p>

        <section className="wheel-event" aria-labelledby="wheel-event-title">
          <h2 id="wheel-event-title">PRÉSENTATION DE L'ÉVÉNEMENT</h2>
          <div className="wheel-event-card">
            <span className="wheel-event-kicker">À PROPOS</span>
            <p>
              Découvrez bientôt les modalités de ce grand rendez-vous. Les exemples affichés sur la roue sont
              uniquement illustratifs : les règles et les récompenses seront précisées avant l’ouverture du tirage.
              En attendant, profitez de l’ambiance et revenez consulter cette page.
            </p>
            <span className="wheel-example-note">Visuels de récompenses à titre d’exemple uniquement.</span>
          </div>
        </section>

        <section
          className={`wheel-history-panel ${historyOpen ? "is-open" : ""}`}
          id="wheel-history-panel"
          aria-label="Historique des tirages"
          hidden={!historyOpen}
        >
          <div className="wheel-history-heading">
            <span className="wheel-history-icon"><History size={18} aria-hidden="true" /></span>
            <div>
              <h2>Historique des tirages</h2>
              <p>Vos participations apparaîtront ici.</p>
            </div>
          </div>
          <div className="wheel-empty-history">
            <span className="wheel-empty-mark" aria-hidden="true"><Clock3 size={21} /></span>
            <strong>Aucun tirage pour le moment</strong>
            <span>L’historique est actuellement vide.</span>
          </div>
        </section>
      </div>
    </main>
  );
}
