import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import shareBanner from "@assets/65bc6d492ce8f4787718eda04f8d93cd_1794334616425.webp";
import "./share.css";

interface CommissionSettings {
  level1Commission?: string;
  level2Commission?: string;
  level3Commission?: string;
}

function formatRate(value?: string) {
  if (value === undefined || value.trim() === "") return "—";
  const rate = Number(value);
  return Number.isFinite(rate) && rate >= 0
    ? `${rate.toLocaleString("fr-FR")}%`
    : "—";
}

export default function SharePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { data: settings } = useQuery<CommissionSettings>({
    queryKey: ["/api/settings"],
  });

  if (!user) return null;

  const referralCode = user.referralCode?.trim() || "";
  const referralLink = referralCode
    ? new URL(`/invitation?invite?code=${encodeURIComponent(referralCode)}`, window.location.origin).toString()
    : "";

  const copyValue = async (value: string, label: string) => {
    if (!value) {
      toast({ title: "Information indisponible", variant: "destructive" });
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = value;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        const copied = document.execCommand("copy");
        textArea.remove();
        if (!copied) throw new Error("copy command failed");
      }
      toast({ title: `${label} copié` });
    } catch {
      toast({
        title: "Copie impossible",
        description: "Sélectionnez le texte et copiez-le manuellement.",
        variant: "destructive",
      });
    }
  };

  const levels = [
    { label: "A", name: "Niveau 1", rate: settings?.level1Commission },
    { label: "B", name: "Niveau 2", rate: settings?.level2Commission },
    { label: "C", name: "Niveau 3", rate: settings?.level3Commission },
  ];

  return (
    <main className="share-page">
      <div className="share-shell">
        <header className="share-header">
          <button
            className="share-back"
            type="button"
            onClick={() => navigate("/my-page")}
            aria-label="Retour à l’accueil"
          >
            <ChevronLeft size={25} strokeWidth={1.8} aria-hidden="true" />
          </button>
          <h1>Partager</h1>
          <span aria-hidden="true" />
        </header>

        <img
          className="share-banner"
          src={shareBanner}
          alt="Équipe Dulux"
        />

        <section className="share-panel" aria-label="Lien de parrainage">
          <div className="share-copy-list">
            <div className="share-copy-row">
              <span className="share-copy-value" title={referralLink}>
                {referralLink || "Lien de parrainage indisponible"}
              </span>
              <button
                type="button"
                onClick={() => void copyValue(referralLink, "Lien")}
                disabled={!referralLink}
                aria-label="Copier le lien de parrainage"
              >
                Copier
              </button>
            </div>
            <div className="share-copy-row">
              <span className="share-copy-value" title={referralCode}>
                {referralCode || "Code indisponible"}
              </span>
              <button
                type="button"
                onClick={() => void copyValue(referralCode, "Code")}
                disabled={!referralCode}
                aria-label="Copier le code de parrainage"
              >
                Copier
              </button>
            </div>
          </div>

          <p className="share-message">
            Partagez votre lien de parrainage et invitez vos proches à découvrir DULUX DT.
          </p>

          <div className="share-levels" aria-label="Taux de commission par niveau">
            {levels.map((level) => (
              <article
                className="share-level-card"
                key={level.label}
                aria-label={`${level.name}: ${formatRate(level.rate)}`}
              >
                <span className="share-level-letter" aria-hidden="true">{level.label}</span>
                <strong>{formatRate(level.rate)}</strong>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
