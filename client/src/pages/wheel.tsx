import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import duluxLogo from "@/assets/images/dulux-logo.png";
import {
  displayWheelPrize,
  type PublicWheelConfiguration,
  type PublicWheelPrize,
} from "@shared/wheel-config";
import "./wheel.css";

type WheelDrawResponse = {
  rewardId: number;
  prizeId: string;
  prizeIndex: number;
  prizeCount: number;
  prizeName: string;
  prizeValue: string;
  status: "credited" | "pending";
  kind: "cash" | "physical";
  remainingSpins: number;
  publicConfiguration: PublicWheelConfiguration;
};

type WheelSlice = {
  id: string;
  label: string;
  prizeName: string;
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

function toWheelSlice(prize: PublicWheelPrize, index: number): WheelSlice {
  const label = prize.kind === "cash" && prize.amount !== null
    ? new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(prize.amount)
    : prize.title;
  return {
    id: prize.id,
    label,
    prizeName: displayWheelPrize(prize),
    imageUrl: prize.imageUrl,
    tone: index % 2 === 0 ? "cream" : "sand",
  };
}

function WheelIllustration({
  slices,
  rotation,
  isSpinning,
}: {
  slices: WheelSlice[];
  rotation: number;
  isSpinning: boolean;
}) {
  let currentAngle = 0;
  return (
    <div className="wheel-stage" aria-label="Roue des lots configurés">
      <div className="wheel-pedestal" aria-hidden="true" />
      <div className="wheel-rim">
        <div className="wheel-lights" aria-hidden="true" />
        <div className="wheel-pointer" aria-hidden="true" />
        <svg
          className="wheel-face"
          viewBox="0 0 300 300"
          role="img"
          aria-label="Lots présentés sur la roue"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? "transform 5.2s cubic-bezier(.12,.68,.12,1)" : "none",
          }}
        >
          {slices.map((slice) => {
            const startAngle = currentAngle;
            const endAngle = startAngle + 360 / Math.max(1, slices.length);
            currentAngle = endAngle;
            const angle = startAngle + (endAngle - startAngle) / 2;
            const position = polarPoint(150, 150, 83, angle);
            return (
              <g key={slice.id} aria-label={slice.prizeName}>
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
  const { toast } = useToast();
  const [rotation, setRotation] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [drawResult, setDrawResult] = useState<WheelDrawResponse | null>(null);
  const rotationRef = useRef(0);
  const animationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const configQuery = useQuery<PublicWheelConfiguration>({
    queryKey: ["/api/wheel/config"],
  });
  const spinsQuery = useQuery<{ availableSpins: number }>({
    queryKey: ["/api/wheel/spins"],
    refetchInterval: 15_000,
  });
  const winnersQuery = useQuery<Array<{ prizeValue: string }>>({
    queryKey: ["/api/wheel/recent-winners"],
    refetchInterval: 30_000,
  });
  const drawMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/wheel/draw", {});
      return response.json() as Promise<WheelDrawResponse>;
    },
    onSuccess: (result) => {
      queryClient.setQueryData(["/api/wheel/config"], result.publicConfiguration);
      queryClient.setQueryData(["/api/wheel/spins"], { availableSpins: result.remainingSpins });
      void queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/wheel/rewards/history"] });

      const selectedCenter = (result.prizeIndex + 0.5) * 360 / Math.max(1, result.prizeCount);
      const alignToPointer = (360 - selectedCenter % 360) % 360;
      const targetRotation = rotationRef.current + (5 * 360) + alignToPointer;
      rotationRef.current = targetRotation;
      setDrawResult(null);
      setIsAnimating(true);
      setRotation(targetRotation);

      if (animationTimer.current) clearTimeout(animationTimer.current);
      animationTimer.current = setTimeout(() => {
        setIsAnimating(false);
        setDrawResult(result);
        toast({
          title: result.status === "credited" ? "Gain crédité" : "Lot gagné",
          description: result.status === "credited"
            ? `${result.prizeValue} a été ajouté à votre solde des revenus.`
            : `${result.prizeValue} — remise à confirmer par l’administration.`,
        });
      }, 5_250);
    },
    onError: (error: Error) => {
      void queryClient.invalidateQueries({ queryKey: ["/api/wheel/spins"] });
      toast({
        title: "Tirage impossible",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => () => {
    if (animationTimer.current) clearTimeout(animationTimer.current);
  }, []);

  const config = configQuery.data ?? {
    buyerSpinsPerPurchase: 0,
    referralSpinsPerPurchase: 0,
    prizes: [],
  };
  const wheelSlices = config.prizes.map(toWheelSlice);
  const winnerMessages = winnersQuery.data?.map((winner) => `Un membre a remporté ${winner.prizeValue}`) ?? [];
  const tickerBaseMessages = winnerMessages.length
    ? winnerMessages
    : config.prizes.map((prize) => `À gagner : ${displayWheelPrize(prize)}`);
  const tickerRepeatCount = tickerBaseMessages.length
    ? Math.max(1, Math.ceil(10 / tickerBaseMessages.length))
    : 0;
  const tickerMessages = Array.from({ length: tickerRepeatCount }, () => tickerBaseMessages).flat();
  const tickerFirstRow = [...tickerMessages, ...tickerMessages];
  const reversedTickerMessages = [...tickerMessages].reverse();
  const tickerSecondRow = [...reversedTickerMessages, ...reversedTickerMessages];
  const spinCount = spinsQuery.isPending || spinsQuery.isError
    ? "—"
    : spinsQuery.data?.availableSpins ?? "—";
  const availableSpins = spinsQuery.data?.availableSpins ?? 0;
  const drawBusy = drawMutation.isPending || isAnimating;

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

        <div
          className="wheel-ticker-stack"
          aria-label={winnerMessages.length ? "Derniers lots réellement gagnés" : "Lots à gagner"}
        >
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

        <WheelIllustration slices={wheelSlices} rotation={rotation} isSpinning={isAnimating} />

        <div className="wheel-spins" aria-label={`Nombre de tirages restants : ${spinCount}`}>
          <span>Nombre de tirages restants: <strong>{spinCount}</strong></span>
        </div>
        <button
          type="button"
          className="wheel-draw-button"
          disabled={drawBusy || configQuery.isError || !configQuery.data || spinsQuery.isError || availableSpins < 1}
          aria-busy={drawBusy}
          onClick={() => {
            setDrawResult(null);
            drawMutation.mutate();
          }}
          data-testid="button-wheel-draw"
        >
          <span>{drawBusy ? "Tirage en cours…" : "Lancer le tirage"}</span>
        </button>
        {drawResult && !isAnimating && (
          <p className="wheel-draw-result" role="status">
            {drawResult.status === "credited"
              ? `Gain crédité : ${drawResult.prizeValue}`
              : `Lot gagné : ${drawResult.prizeValue} — remise en attente`}
          </p>
        )}
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
          </div>
        </section>
        {configQuery.isError && (
          <p className="wheel-config-warning" role="alert">Impossible de charger la roue. Le tirage est temporairement désactivé.</p>
        )}
        {spinsQuery.isError && (
          <p className="wheel-config-warning" role="alert">Impossible de vérifier vos tours disponibles. Réessayez dans quelques instants.</p>
        )}

      </div>
    </main>
  );
}
