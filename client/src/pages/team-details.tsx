import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ChevronLeft, UsersRound } from "lucide-react";
import whatsappIcon from "@assets/images_(26)_1787367952281.png";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { getCountryByCode, type ApiCountry } from "@/lib/countries";
import "./team-details.css";

interface TeamMember {
  id: number;
  maskedPhone: string;
  whatsappNumber: string | null;
  isDemo: boolean;
  demoPreview: {
    maskedPhone: string;
    vipLevel: number;
    totalInvested: number;
    totalReferralRevenue: number;
  } | null;
  totalReferralRevenue: number;
  vipLevel: number | null;
}

interface TeamDetails {
  level1: TeamMember[];
  level2: TeamMember[];
  level3: TeamMember[];
  totalLevel1Invested: number;
  totalLevel2Invested: number;
  totalLevel3Invested: number;
}

const levelFromUrl = (): 1 | 2 | 3 => {
  const level = Number(new URLSearchParams(window.location.search).get("level"));
  return level === 2 || level === 3 ? level : 1;
};

export default function TeamDetailsPage() {
  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3>(levelFromUrl);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { data: team, isLoading, isFetching, isError, refetch } = useQuery<TeamDetails>({
    queryKey: ["/api/team/details"],
    staleTime: 30_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  const { data: countries } = useQuery<ApiCountry[]>({ queryKey: ["/api/countries"] });

  const currency = getCountryByCode(user?.country || "", countries)?.currency || "FCFA";
  const levels = [
    { num: 1 as const, name: "A", members: team?.level1 || [], totalInvested: team?.totalLevel1Invested || 0 },
    { num: 2 as const, name: "B", members: team?.level2 || [], totalInvested: team?.totalLevel2Invested || 0 },
    { num: 3 as const, name: "C", members: team?.level3 || [], totalInvested: team?.totalLevel3Invested || 0 },
  ];
  const selected = levels[activeLevel - 1];
  const demoInvested = selected.members.reduce((total, member) => total + (member.demoPreview?.totalInvested || 0), 0);
  const hasDemoMembers = selected.members.some(member => member.isDemo);
  const message = activeLevel === 1
    ? "Bonjour ! Je suis votre parrain sur Equinor. Je voulais m'assurer que tout se passe bien pour vous. Si vous avez des questions sur l'inscription, les produits ou l'utilisation de l'application, dites-moi ce qui n'est pas clair. Je prendrai le temps de vous expliquer et de vous accompagner étape par étape. N'hésitez pas à m'écrire ici !"
    : "Bonjour ! Je fais partie de votre équipe de parrainage sur Equinor. Je voulais m'assurer que tout se passe bien pour vous. Si vous avez des questions sur l'inscription, les produits ou l'utilisation de l'application, dites-moi ce qui n'est pas clair. Je prendrai le temps de vous expliquer et de vous accompagner étape par étape. N'hésitez pas à m'écrire ici !";

  return (
    <main className="team-details-page">
      <div className="team-details-shell">
        <header className="team-details-header">
          <button type="button" onClick={() => navigate("/team")} aria-label="Retour à l'équipe" data-testid="button-back-team">
            <ChevronLeft aria-hidden="true" />
          </button>
          <h1 data-testid="text-page-title">Détails de l'équipe</h1>
          <span>Equinor</span>
        </header>

        <div className="team-details-content" aria-busy={isLoading || isFetching}>
          <nav className="team-details-tabs" aria-label="Choisir un niveau d'équipe">
            {levels.map(level => (
              <button
                type="button"
                key={level.num}
                onClick={() => setActiveLevel(level.num)}
                className={activeLevel === level.num ? "is-active" : ""}
                aria-current={activeLevel === level.num ? "true" : undefined}
                data-testid={`tab-level-${level.num}`}
              >
                Équipe {level.name}
              </button>
            ))}
          </nav>

          {hasDemoMembers && (
            <p className="team-details-demo-notice">
              Aperçu Démo : les achats, niveaux VIP et bonus ci-dessous sont des exemples fictifs. Ils ne modifient ni votre solde ni vos opérations réelles.
            </p>
          )}

          <section className="team-details-stats" aria-label={`Résumé de l'équipe ${selected.name}`}>
            <div>
              <span>Membres de l'équipe</span>
              <strong data-testid="text-member-count">{isLoading ? "…" : selected.members.length}</strong>
            </div>
            <div>
              <span>Achats de l'équipe</span>
              <strong data-testid="text-total-invested">{isLoading ? "…" : `${(Number(selected.totalInvested) + demoInvested).toLocaleString("fr-FR")} ${currency}`}</strong>
              {demoInvested > 0 && <small>dont {demoInvested.toLocaleString("fr-FR")} {currency} fictifs</small>}
            </div>
          </section>

          <section className="team-details-members" aria-label={`Filleuls de l'équipe ${selected.name}`}>
            <h2>Filleuls · Équipe {selected.name}</h2>
            <p className="team-details-explanation">
              Le revenu total correspond aux bonus de parrainage reçus pour chaque filleul.
            </p>
            <div className="team-details-columns" aria-hidden="true">
              <span>Utilisateur</span><span>Revenu total</span><span>VIP</span><span>Contact</span>
            </div>

            {isLoading ? (
              <div className="team-details-loading" aria-label="Chargement des filleuls">
                {[0, 1, 2].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : isError ? (
              <div className="team-details-empty" role="alert">
                <strong>Impossible de charger les membres de l'équipe.</strong>
                <span>Vérifiez votre connexion puis réessayez.</span>
                <button type="button" className="team-details-retry" onClick={() => void refetch()} disabled={isFetching}>
                  {isFetching ? "Chargement…" : "Réessayer"}
                </button>
              </div>
            ) : selected.members.length === 0 ? (
              <div className="team-details-empty">
                <UsersRound aria-hidden="true" />
                <strong>Aucun membre dans l'équipe {selected.name}</strong>
                <span>Invitez des proches pour développer votre équipe.</span>
              </div>
            ) : selected.members.map(member => {
              const phone = member.maskedPhone;
              const whatsappHref = member.isDemo
                ? `https://wa.me/?text=${encodeURIComponent(message)}`
                : member.whatsappNumber ? `https://wa.me/${member.whatsappNumber}?text=${encodeURIComponent(message)}` : null;
              return (
                <div className="team-details-row" key={member.id} data-testid={`team-member-${member.id}`}>
                  <strong data-testid={`text-member-phone-${member.id}`}>
                    {phone}
                    {member.isDemo && <small className="team-details-demo">Démo</small>}
                  </strong>
                  <span className="team-details-revenue" data-testid={`text-member-revenue-${member.id}`}>
                    {Number(member.demoPreview?.totalReferralRevenue ?? member.totalReferralRevenue).toLocaleString("fr-FR")}
                    <small>{currency}</small>
                  </span>
                  <span className="team-details-vip" data-testid={`text-member-vip-${member.id}`}>
                    {(member.demoPreview?.vipLevel ?? member.vipLevel) ? `VIP ${member.demoPreview?.vipLevel ?? member.vipLevel}` : "—"}
                  </span>
                  {whatsappHref ? (
                    <a
                      className="team-details-whatsapp"
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={member.isDemo ? "Aperçu du message WhatsApp sans destinataire" : `Écrire à ${phone} sur WhatsApp`}
                      title={member.isDemo ? "Démo : message sans destinataire" : undefined}
                      data-testid={`whatsapp-member-${member.id}`}
                    >
                      <img src={whatsappIcon} alt="" />
                    </a>
                  ) : (
                    <span className="team-details-contact-unavailable" title={member.isDemo ? "Filleul fictif : contact indisponible" : "Numéro WhatsApp indisponible"} aria-label="Numéro WhatsApp indisponible">—</span>
                  )}
                </div>
              );
            })}
          </section>
        </div>
      </div>
    </main>
  );
}