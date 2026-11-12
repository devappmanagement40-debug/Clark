import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import duluxLogo from "@/assets/images/dulux-logo.png";
import {
  DEFAULT_WHEEL_CONFIGURATION,
  displayWheelPrize,
  getPublicWheelConfiguration,
  type PublicWheelConfiguration,
  type WheelPrizeConfiguration,
} from "@shared/wheel-config";
import "./wheel.css";

type WheelSlice = {
  id: string;
  label: string;
  prizeName: string;
  probability: number;
  imageUrl: string | null;
  tone: "cream" | "sand";
};

function polarPoint(cx: number, cy: number, radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
}

function slicePath(startAngle: number, endAngle: number) {
  if (endAngle - startAngle >= 359.99) {
    return "M 150 150 L 150 23 A 127 127 0 1 1 150 277 A 127 127 0 1 1 150 23 Z";
  }
  const start = polarPoint(150, 150, 127, startAngle);
  const end = polarPoint(150, 150, 127, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M 150 150 L ${start.x} ${start.y} A 127 127 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

function toWheelSlice(prize: WheelPrizeConfiguration, index: number): WheelSlice {
  const label = prize.kind === "cash" && prize.amount !== null
    ? new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(prize.amount)
    : prize.title;
  return {
    id: prize.id,
    label,
    prizeName: displayWheelPrize(prize),
    probability: prize.probability,
    imageUrl: prize.imageUrl,
    tone: index % 2 === 0 ? "cream" : "sand",
  };
}

function WheelIllustration({ slices }: { slices: WheelSlice[] }) {
  let currentAngle = 0;
  const totalProbability = slices.reduce((total, slice) => total + slice.probability, 0);
  return (
    <div className="wheel-stage" aria-label="Roue des lots configurés">
      <div className="wheel-pedestal" aria-hidden="true" />
      <div className="wheel-rim">
        <div className="wheel-lights" aria-hidden="true" />
        <div className="wheel-pointer" aria-hidden="true" />
        <svg className="wheel-face" viewBox="0 0 300 300" role="img" aria-label="Lots et probabilités configurés dans l’administration">
          {slices.map((slice) => {
            const startAngle = currentAngle;
            const endAngle = startAngle + 360 * slice.probability / totalProbability;
            currentAngle = endAngle;
            const angle = startAngle + (endAngle - startAngle) / 2;
            const position = polarPoint(150, 150, 83, angle);
            return (
              <g key={slice.id} aria-label={`${slice.prizeName}, ${slice.probability}%`}>
                <path d={slicePath(startAngle, endAngle)} className={`wheel-slice wheel-slice-${slice.tone}`} />
                {slice.imageUrl ? (
                  <image
                    href={slice.imageUrl}
                    x={position.x - 27}
                    y={position.y - 21}
                    width={54}
                    height={42}
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
                    fontSize={slice.label.length > 7 ? 8 : 13}
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
  const configQuery = useQuery<PublicWheelConfiguration>({
    queryKey: ["/api/wheel/config"],
  });
  const spinsQuery = useQuery<{ availableSpins: number }>({
    queryKey: ["/api/wheel/spins"],
    refetchInterval: 15_000,
  });
  const config = configQuery.data ?? getPublicWheelConfiguration(DEFAULT_WHEEL_CONFIGURATION);
  const wheelSlices = config.prizes.map(toWheelSlice);
  const tickerValues = config.prizes.map(displayWheelPrize);
  const tickerFirstRow = [...tickerValues, ...tickerValues];
  const tickerSecondRow = [...tickerValues].reverse().concat([...tickerValues].reverse());
  const spinCount = spinsQuery.isPending || spinsQuery.isError
    ? "—"
    : spinsQuery.data?.availableSpins ?? "—";

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
        className="wheel-history-tab"
        onClick={() => navigate("/my-page/wheel/history")}
      >
        <span>Historique</span>
      </button>

      <div className="wheel-content">
        <header className="wheel-heading">
          <h1><span>Grand Tirage</span> <span className="wheel-heading-emphasis">Chanceux</span></h1>
          <p className="wheel-good-luck">Bonne Chance</p>
          <p className="wheel-keep-going">Continuez à rouler !</p>
        </header>

        <div className="wheel-ticker-stack" aria-label="Lots actifs de la roue">
          <div className="wheel-ticker">
            <div className="wheel-ticker-track">
              {tickerFirstRow.map((value, index) => <span key={`top-${index}-${value}`}>{value}</span>)}
            </div>
          </div>
          <div className="wheel-ticker wheel-ticker-reverse">
            <div className="wheel-ticker-track">
              {tickerSecondRow.map((value, index) => <span key={`bottom-${index}-${value}`}>{value}</span>)}
            </div>
          </div>
        </div>

        <WheelIllustration slices={wheelSlices} />

        <div className="wheel-spins" aria-label={`Nombre de tirages restants : ${spinCount}`}>
          <span>Nombre de tirages restants: <strong>{spinCount}</strong></span>
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
              Chaque achat payant confirmé vous attribue {config.buyerSpinsPerPurchase} tour{config.buyerSpinsPerPurchase === 1 ? "" : "s"}.
              {" "}Chaque achat payant confirmé réalisé par votre filleul direct vous attribue {config.referralSpinsPerPurchase} tour{config.referralSpinsPerPurchase === 1 ? "" : "s"}.
            </p>
            <details className="wheel-probabilities">
              <summary>Probabilités des lots actifs</summary>
              <ul>
                {config.prizes.map((prize) => (
                  <li key={prize.id}>
                    <span>{displayWheelPrize(prize)}</span>
                    <strong>{prize.probability}%</strong>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </section>
        {configQuery.isError && (
          <p className="wheel-config-warning" role="alert">Impossible de confirmer la configuration de la roue. Les montants et probabilités affichés ne sont pas vérifiés.</p>
        )}

      </div>
    </main>
  );
}
