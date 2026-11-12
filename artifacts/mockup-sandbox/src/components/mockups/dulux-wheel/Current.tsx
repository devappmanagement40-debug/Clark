import { useState } from "react";
import { ArrowLeft, Clock3, History } from "lucide-react";
import "./_group.css";
import "./wheel.css";

type WheelSlice = {
  label?: string;
  image?: { src: string; alt: string; width: number; height: number };
  tone: "cream" | "sand";
};

const smartphonePrize = "/__mockup/images/wheel-prizes/smartphone.jpg";
const motorcyclePrize = "/__mockup/images/wheel-prizes/motorcycle.jpg";
const headphonesPrize = "/__mockup/images/wheel-prizes/headphones.jpg";

const wheelSlices: WheelSlice[] = [
  { label: "777", tone: "cream" },
  { label: "2777", tone: "sand" },
  { label: "7777", tone: "cream" },
  { label: "27777", tone: "sand" },
  { label: "17777", tone: "cream" },
  { label: "37777", tone: "sand" },
  { label: "97777", tone: "cream" },
  { image: { src: headphonesPrize, alt: "Casque audio", width: 42, height: 42 }, tone: "sand" },
  { image: { src: smartphonePrize, alt: "Téléphone", width: 42, height: 42 }, tone: "cream" },
  { image: { src: motorcyclePrize, alt: "Moto", width: 54, height: 34 }, tone: "sand" },
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

function WheelIllustration() {
  return (
    <div className="wheel-stage" aria-label="Roue décorative, exemples de segments non configurés">
      <div className="wheel-pedestal" aria-hidden="true" />
      <div className="wheel-rim">
        <div className="wheel-lights" aria-hidden="true" />
        <div className="wheel-pointer" aria-hidden="true" />
        <svg className="wheel-face" viewBox="0 0 300 300" role="img" aria-label="Montants et images des lots de la roue">
          {wheelSlices.map((slice, index) => {
            const sliceAngle = 360 / wheelSlices.length;
            const angle = index * sliceAngle + sliceAngle / 2;
            const position = polarPoint(150, 150, 83, angle);
            return (
              <g key={`${slice.label ?? slice.image?.alt}-${index}`}>
                <path d={slicePath(index)} className={`wheel-slice wheel-slice-${slice.tone}`} />
                {slice.image ? (
                  <image
                    href={slice.image.src}
                    x={position.x - slice.image.width / 2}
                    y={position.y - slice.image.height / 2}
                    width={slice.image.width}
                    height={slice.image.height}
                    preserveAspectRatio="xMidYMid meet"
                    transform={`rotate(${angle}, ${position.x}, ${position.y})`}
                    className="wheel-prize-image"
                    aria-hidden="true"
                  />
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
          <img src="/__mockup/images/dulux-wheel-logo.png" alt="Dulux" />
        </div>
      </div>
    </div>
  );
}

function WheelPage() {
  const navigate = (_path: string) => {};
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
              <span>Moto</span>
              <span>Casque audio</span>
              <span>Téléphone</span>
              <span>Moto</span>
              <span>Casque audio</span>
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
            <div className="wheel-event-note-heading">
              <h3>À savoir</h3>
            </div>
            <p>
              Chaque achat confirmé d’un produit vous donne droit à un tour de roue supplémentaire.
              {" "}Chaque achat confirmé par un filleul vous donne droit à un tour de roue.
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


export default function WheelPreview() {
  return <WheelPage />;
}
