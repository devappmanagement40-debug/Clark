import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Clock3, History } from "lucide-react";
import duluxLogo from "@/assets/images/dulux-logo.png";
import "./wheel.css";

type WheelSlice = {
  label?: string;
  icon?: "card" | "phone" | "gift";
  tone: "cream" | "sand";
};

const wheelSlices: WheelSlice[] = [
  { label: "777", tone: "cream" },
  { label: "2777", tone: "sand" },
  { label: "7777", tone: "cream" },
  { label: "27777", tone: "sand" },
  { label: "17777", tone: "cream" },
  { label: "37777", tone: "sand" },
  { label: "97777", tone: "cream" },
  { icon: "gift", tone: "sand" },
  { icon: "phone", tone: "cream" },
  { icon: "card", tone: "sand" },
];

function polarPoint(cx: number, cy: number, radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
}

function slicePath(index: number) {
  const sliceAngle = 360 / wheelSlices.length;
  const startAngle = index * sliceAngle;
  const endAngle = startAngle + sliceAngle;
  const start = polarPoint(150, 150, 127, startAngle);
  const end = polarPoint(150, 150, 127, endAngle);
  return `M 150 150 L ${start.x} ${start.y} A 127 127 0 0 1 ${end.x} ${end.y} Z`;
}

function PrizeIllustration({ icon, x, y, angle }: { icon: string; x: number; y: number; angle: number }) {
  const transform = `rotate(${angle}, ${x}, ${y})`;

  if (icon === "card") {
    return (
      <g transform={transform} aria-hidden="true">
        <rect x={x - 18} y={y - 11} width="36" height="22" rx="3" fill="#19b9bd" stroke="#164b66" strokeWidth="2" />
        <path d={`M${x - 16} ${y - 4}h32`} stroke="#ffe88b" strokeWidth="4" />
        <path d={`M${x - 11} ${y + 4}h10`} stroke="#fff" strokeWidth="2" opacity=".9" />
        <circle cx={x + 10} cy={y + 4} r="3" fill="#f6c744" />
      </g>
    );
  }

  if (icon === "phone") {
    return (
      <g transform={transform} aria-hidden="true">
        <rect x={x - 11} y={y - 19} width="22" height="38" rx="4" fill="#e7e9e5" stroke="#8d9695" strokeWidth="2" />
        <rect x={x - 8} y={y - 14} width="16" height="27" rx="2" fill="#f8faf8" />
        <rect x={x - 5} y={y - 8} width="10" height="3" rx="1.5" fill="#d9e2e2" />
        <circle cx={x} cy={y + 16} r="1.5" fill="#727c7d" />
      </g>
    );
  }

  return (
    <g transform={transform} aria-hidden="true">
      <path d={`M${x - 14} ${y - 8}h28l-3 23h-22z`} fill="#d8d7e4" stroke="#aaa9bb" strokeWidth="2" />
      <path d={`M${x - 8} ${y - 8}c0-10 16-10 16 0`} fill="none" stroke="#aaa9bb" strokeWidth="3" />
      <path d={`M${x} ${y - 3}v10m-4-5h8`} stroke="#6c9c75" strokeWidth="2" />
    </g>
  );
}

function WheelIllustration() {
  return (
    <div className="wheel-stage" aria-label="Roue décorative, exemples de segments non configurés">
      <div className="wheel-pedestal" aria-hidden="true" />
      <div className="wheel-rim">
        <div className="wheel-lights" aria-hidden="true" />
        <div className="wheel-pointer" aria-hidden="true" />
        <svg className="wheel-face" viewBox="0 0 300 300" role="img" aria-label="Segments illustratifs, aucun lot configuré">
          {wheelSlices.map((slice, index) => {
            const sliceAngle = 360 / wheelSlices.length;
            const angle = index * sliceAngle + sliceAngle / 2;
            const position = polarPoint(150, 150, 83, angle);
            return (
              <g key={`${slice.label ?? slice.icon}-${index}`}>
                <path d={slicePath(index)} className={`wheel-slice wheel-slice-${slice.tone}`} />
                {slice.icon ? (
                  <PrizeIllustration icon={slice.icon} x={position.x} y={position.y} angle={angle} />
                ) : (
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
                )}
              </g>
            );
          })}
        </svg>
        <div className="wheel-hub-logo">
          <img src={duluxLogo} alt="Dulux" />
        </div>
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
        <ArrowLeft size={24} aria-hidden="true" />
      </button>

      <button
        type="button"
        className={`wheel-history-tab ${historyOpen ? "is-open" : ""}`}
        aria-expanded={historyOpen}
        aria-controls="wheel-history-panel"
        onClick={() => setHistoryOpen((open) => !open)}
      >
        <span>Historique</span>
      </button>

      <div className="wheel-content">
        <header className="wheel-heading">
          <h1><span>Grand Tirage</span> <span className="wheel-heading-emphasis">Chanceux</span></h1>
          <p className="wheel-good-luck">Bonne Chance</p>
          <p className="wheel-keep-going">Continuez à rouler !</p>
        </header>

        <div className="wheel-ticker-stack" aria-label="Lots et montants de la roue">
          <div className="wheel-ticker">
            <div className="wheel-ticker-track">
              <span>777 XOF</span>
              <span>2 777 XOF</span>
              <span>7 777 XOF</span>
              <span>27 777 XOF</span>
              <span>17 777 XOF</span>
              <span>37 777 XOF</span>
              <span>97 777 XOF</span>
              <span>777 XOF</span>
              <span>2 777 XOF</span>
              <span>7 777 XOF</span>
              <span>27 777 XOF</span>
              <span>17 777 XOF</span>
              <span>37 777 XOF</span>
              <span>97 777 XOF</span>
            </div>
          </div>
          <div className="wheel-ticker wheel-ticker-reverse">
            <div className="wheel-ticker-track">
              <span>Téléphone</span>
              <span>Power bank</span>
              <span>Carte cadeau</span>
              <span>Téléphone</span>
              <span>Power bank</span>
              <span>Carte cadeau</span>
            </div>
          </div>
        </div>

        <WheelIllustration />

        <div className="wheel-spins" aria-label="Nombre de tirages restants : 0">
          <span>Nombre de tirages restants: <strong>0</strong></span>
        </div>
        <button
          type="button"
          className="wheel-draw-button"
          disabled
        >
          <span>Lancer le tirage</span>
        </button>
        <section className="wheel-event" aria-labelledby="wheel-event-title">
          <h2 id="wheel-event-title">PRÉSENTATION DE L'ÉVÉNEMENT</h2>
          <div className="wheel-event-card">
            <span className="wheel-event-kicker" aria-hidden="true">📣📣📣 :</span>
            <p>
              Cette section présente les lots, les montants possibles et les règles du tirage. Les conditions de
              participation, les probabilités associées à chaque récompense et les modalités de remise seront
              précisées avant l’ouverture. Consultez toutes les informations avant de lancer le tirage. Bonne chance !
            </p>
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
