import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Coins, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getCountryByCode } from "@/lib/countries";
import treasureChest from "@assets/tbox1.30c08f03_1794378979582.png";

type GiftClaimResult = {
  amount: number;
};

export default function GiftCodePage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [code, setCode] = useState("");
  const [entryOpen, setEntryOpen] = useState(false);
  const [claimResult, setClaimResult] = useState<GiftClaimResult | null>(null);
  const currency = getCountryByCode(user?.country || "")?.currency || "XOF";
  const formatMoney = (amount: number) =>
    `${Math.round(amount).toLocaleString("fr-FR")} ${currency === "FCFA" ? "XOF" : currency}`;

  const claimMutation = useMutation({
    mutationFn: async (giftCode: string): Promise<GiftClaimResult> => {
      const response = await apiRequest("POST", "/api/gift-codes/claim", { code: giftCode });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Le code cadeau n'a pas pu être validé.");
      }
      const amount = Number(data.amount);
      if (!Number.isFinite(amount)) {
        throw new Error("La récompense du code n'a pas pu être lue.");
      }
      return { amount };
    },
    onSuccess: (result) => {
      refreshUser();
      setCode("");
      setEntryOpen(false);
      setClaimResult(result);
    },
    onError: (error) => {
      toast({
        title: "Ouverture du coffre impossible",
        description: error instanceof Error ? error.message : "Le code cadeau n'a pas pu être validé.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) {
      toast({
        title: "Code requis",
        description: "Saisissez le code du coffre pour continuer.",
        variant: "destructive",
      });
      return;
    }
    claimMutation.mutate(normalizedCode);
  };

  return (
    <main className="gift-treasure-page">
      <style>{`
        .gift-treasure-page {
          position: relative;
          width: 100%;
          min-height: 100dvh;
          overflow: hidden;
          isolation: isolate;
          color: #f7f4ec;
          background:
            radial-gradient(ellipse at 50% 48%, rgba(35, 79, 151, .92) 0%, rgba(21, 53, 111, .68) 28%, transparent 67%),
            linear-gradient(145deg, #173c79 0%, #102f68 45%, #0a2048 100%);
          font-family: "DM Sans", "Avenir Next", sans-serif;
        }
        .gift-treasure-page::before {
          position: absolute;
          inset: 0;
          z-index: 0;
          content: "";
          pointer-events: none;
          background:
            radial-gradient(ellipse at 50% 48%, transparent 15%, rgba(4, 15, 39, .12) 52%, rgba(3, 13, 35, .58) 100%),
            linear-gradient(115deg, rgba(255,255,255,.045), transparent 38%, rgba(4,17,46,.2));
        }
        .gift-treasure-page::after {
          position: absolute;
          z-index: 0;
          inset: -45%;
          content: "";
          pointer-events: none;
          background: repeating-conic-gradient(
            from -5deg at 50% 50%,
            rgba(242, 202, 111, .15) 0deg 2deg,
            rgba(101, 145, 214, .10) 2deg 4deg,
            transparent 4deg 10deg,
            rgba(215, 228, 250, .09) 10deg 11deg,
            transparent 11deg 15deg
          );
          -webkit-mask-image: radial-gradient(ellipse at center, transparent 0%, transparent 7%, rgba(0,0,0,.4) 18%, #000 44%, transparent 78%);
          mask-image: radial-gradient(ellipse at center, transparent 0%, transparent 7%, rgba(0,0,0,.4) 18%, #000 44%, transparent 78%);
          transform-origin: center;
          animation: gift-rays-rotate 28s linear infinite;
        }
        .gift-treasure-page * { box-sizing: border-box; }
        .gift-treasure-screen {
          position: relative;
          z-index: 1;
          display: flex;
          min-height: 100dvh;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: max(72px, calc(env(safe-area-inset-top) + 62px)) 20px max(32px, env(safe-area-inset-bottom));
        }
        .gift-treasure-back {
          position: absolute;
          top: max(18px, env(safe-area-inset-top));
          left: max(18px, env(safe-area-inset-left));
          display: grid;
          width: 50px;
          height: 50px;
          place-items: center;
          border: 2px solid #f2c55e;
          border-radius: 14px;
          background: linear-gradient(145deg, #28589f 0%, #123d83 55%, #0a2b66 100%);
          color: #fff;
          cursor: pointer;
          box-shadow: 0 5px 14px rgba(1, 11, 31, .4), inset 0 1px 0 rgba(255, 255, 255, .2);
          transition: background .2s ease, box-shadow .2s ease, transform .2s ease;
        }
        .gift-treasure-back:hover {
          background: linear-gradient(145deg, #3568b4 0%, #17498f 55%, #103878 100%);
          box-shadow: 0 7px 18px rgba(1, 11, 31, .48), inset 0 1px 0 rgba(255, 255, 255, .25);
          transform: translateX(-2px);
        }
        .gift-treasure-back:active { transform: translateX(-2px) scale(.96); }
        .gift-treasure-back:focus-visible {
          outline: 3px solid #f2c55e;
          outline-offset: 3px;
        }
        .gift-treasure-heading {
          position: absolute;
          top: max(25px, env(safe-area-inset-top));
          left: 76px;
          right: 76px;
          margin: 0;
          color: #fff8e7;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(19px, 4vw, 25px);
          font-weight: 700;
          letter-spacing: .025em;
          text-align: center;
          text-shadow: 0 2px 14px rgba(1, 12, 34, .55);
        }
        .gift-treasure-chest {
          display: grid;
          width: min(76vw, 390px);
          aspect-ratio: 1;
          place-items: center;
          margin: 16px 0 0;
          border: 0;
          border-radius: 0;
          padding: 0;
          background: transparent;
          cursor: pointer;
          animation: gift-chest-float 3s ease-in-out infinite;
          filter: drop-shadow(0 22px 28px rgba(1, 11, 31, .42));
          -webkit-tap-highlight-color: transparent;
          transition: filter .2s ease;
        }
        .gift-treasure-chest:hover {
          filter: drop-shadow(0 24px 32px rgba(1, 11, 31, .5));
        }
        .gift-treasure-chest img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transform: scale(.88);
          mix-blend-mode: multiply;
        }
        .gift-treasure-chest:focus-visible {
          outline: 3px solid #f2c55e;
          outline-offset: 7px;
        }
        .gift-treasure-dialog {
          width: min(400px, calc(100vw - 32px));
          max-width: 400px;
          gap: 0;
          overflow: visible;
          border: 1px solid rgba(220, 174, 79, .65);
          border-radius: 17px;
          padding: 0;
          background: #fffdf8;
          color: #18345e;
          box-shadow: 0 24px 72px rgba(1, 12, 34, .48), 0 0 0 5px rgba(241, 197, 91, .10);
        }
        .gift-treasure-dialog > button:last-of-type {
          top: -11px;
          right: -11px;
          display: grid;
          width: 40px;
          height: 40px;
          place-items: center;
          border: 2px solid #fffdf8;
          border-radius: 50%;
          background: #c9363f;
          color: white;
          opacity: 1;
          box-shadow: 0 4px 12px rgba(62, 12, 20, .28);
        }
        .gift-treasure-dialog > button:last-of-type svg { width: 25px; height: 25px; }
        .gift-treasure-dialog-head {
          padding: 26px 24px 18px;
          border-bottom: 1px solid #ede8dd;
          text-align: center;
        }
        .gift-treasure-dialog-title {
          margin: 0;
          color: #18345e;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 21px;
          font-weight: 700;
          line-height: 1.35;
        }
        .gift-treasure-dialog-description {
          margin: 7px 0 0;
          color: #64738a;
          font-size: 14px;
          line-height: 1.5;
        }
        .gift-treasure-form { padding: 19px 22px 0; }
        .gift-treasure-input {
          width: 100%;
          height: 50px;
          border: 1px solid #d4d9e2;
          border-radius: 7px;
          padding: 0 14px;
          background: #fff;
          color: #18345e;
          font-size: 16px;
          outline: none;
          transition: border-color .2s ease, box-shadow .2s ease;
        }
        .gift-treasure-input:focus {
          border-color: #2458a5;
          box-shadow: 0 0 0 3px rgba(36, 88, 165, .15);
        }
        .gift-treasure-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          margin-top: 17px;
          border-top: 1px solid #e8e5dd;
        }
        .gift-treasure-action {
          display: grid;
          min-height: 56px;
          place-items: center;
          border: 0;
          background: #fffdf8;
          color: #173b72;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background .18s ease, color .18s ease;
        }
        .gift-treasure-action:first-child { border-radius: 0 0 0 16px; }
        .gift-treasure-action:first-child:hover { background: #f6f2e9; }
        .gift-treasure-action:last-child {
          border-radius: 0 0 16px 0;
          background: #123f8b;
          color: white;
        }
        .gift-treasure-action:last-child:hover { background: #0d3476; }
        .gift-treasure-action:disabled { cursor: wait; opacity: .75; }
        .gift-treasure-action:focus-visible {
          position: relative;
          z-index: 1;
          outline: 3px solid #d4a844;
          outline-offset: -4px;
        }
        .gift-result-content {
          padding: 25px 22px 0;
          text-align: center;
        }
        .gift-result-title {
          margin: 0;
          color: #18345e;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 20px;
          font-weight: 700;
          line-height: 1.4;
        }
        .gift-result-amount {
          margin: 12px 0 4px;
          color: #b8323e;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 32px;
          font-weight: 800;
          line-height: 1.2;
          font-variant-numeric: tabular-nums;
        }
        .gift-result-chest {
          display: block;
          width: 150px;
          height: 150px;
          margin: 8px auto 0;
          object-fit: contain;
          filter: drop-shadow(0 8px 12px rgba(121, 82, 12, .23));
          mix-blend-mode: multiply;
        }
        .gift-result-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          margin-top: 12px;
          border-top: 1px solid #e8e5dd;
        }
        .gift-result-actions .gift-treasure-action:last-child {
          background: #123f8b;
          color: #fff;
        }
        @keyframes gift-rays-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes gift-chest-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @media (min-width: 700px) {
          .gift-treasure-screen { padding-top: 90px; }
          .gift-treasure-chest { width: min(42vw, 410px); }
        }
        @media (max-width: 380px) {
          .gift-treasure-screen { padding-right: 16px; padding-left: 16px; }
          .gift-treasure-chest { width: min(82vw, 330px); }
          .gift-treasure-dialog-head { padding: 23px 18px 15px; }
          .gift-treasure-form { padding-right: 17px; padding-left: 17px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .gift-treasure-page::after,
          .gift-treasure-chest { animation: none; }
          .gift-treasure-back,
          .gift-treasure-chest,
          .gift-treasure-input,
          .gift-treasure-action { transition: none; }
        }
      `}</style>

      <section className="gift-treasure-screen" aria-label="Coffre des codes cadeaux">
        <button
          type="button"
          className="gift-treasure-back"
          aria-label="Retour à l’accueil"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={22} aria-hidden="true" />
        </button>
        <h1 className="gift-treasure-heading">Coffre cadeau</h1>
        <button
          className="gift-treasure-chest"
          type="button"
          aria-label="Ouvrir le coffre et saisir un code cadeau"
          onClick={() => setEntryOpen(true)}
          data-testid="button-open-gift-chest"
        >
          <img src={treasureChest} alt="" draggable={false} />
        </button>
      </section>

      <Dialog open={entryOpen} onOpenChange={setEntryOpen}>
        <DialogContent className="gift-treasure-dialog">
          <DialogHeader className="gift-treasure-dialog-head">
            <DialogTitle className="gift-treasure-dialog-title">Saisir le code du coffre</DialogTitle>
            <DialogDescription className="gift-treasure-dialog-description">
              Entrez votre code cadeau pour ouvrir le coffre.
            </DialogDescription>
          </DialogHeader>
          <form className="gift-treasure-form" onSubmit={handleSubmit}>
            <input
              className="gift-treasure-input"
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="Saisir le code du coffre"
              autoComplete="off"
              autoCapitalize="characters"
              aria-label="Code cadeau"
              data-testid="input-gift-code"
            />
            <div className="gift-treasure-actions">
              <button
                type="button"
                className="gift-treasure-action"
                onClick={() => setEntryOpen(false)}
                disabled={claimMutation.isPending}
              >
                Annuler
              </button>
              <button
                className="gift-treasure-action"
                type="submit"
                disabled={claimMutation.isPending}
                data-testid="button-submit-code"
              >
                {claimMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Ouvrir"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={claimResult !== null} onOpenChange={(open) => { if (!open) setClaimResult(null); }}>
        <DialogContent className="gift-treasure-dialog">
          {claimResult && (
            <>
              <div className="gift-result-content">
                <DialogTitle className="gift-result-title">Le coffre a été ouvert avec succès</DialogTitle>
                <p className="gift-result-amount">{formatMoney(claimResult.amount)}</p>
                <img className="gift-result-chest" src={treasureChest} alt="Illustration du coffre cadeau" />
              </div>
              <div className="gift-result-actions">
                <button
                  type="button"
                  className="gift-treasure-action"
                  onClick={() => setClaimResult(null)}
                >
                  Fermer
                </button>
                <button
                  type="button"
                  className="gift-treasure-action"
                  onClick={() => {
                    setClaimResult(null);
                    navigate("/wallet?from=gift-code");
                  }}
                >
                  <span className="inline-flex items-center gap-2"><Coins size={18} aria-hidden="true" /> Solde</span>
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
