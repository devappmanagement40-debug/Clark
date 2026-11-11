import { Bell, ChevronRight, Send } from "lucide-react";
import chargePointLogo from "./chargepoint-icon-512.png";
import "./_group.css";
import "./welcome.css";
import "./professional.css";

const rules = [
  "Montant minimum du dépôt : 3 500 XOF.",
  "Montant minimum du retrait : 1 200 XOF.",
  "Frais de retrait : 20 % du montant demandé. Le montant net estimé après frais est affiché avant validation.",
  "Limite quotidienne de retrait : 1 demande par jour.",
  "Horaires de retrait : de 9 h à 17 h.",
  "Délai de traitement : généralement sous 2 heures et, exceptionnellement, jusqu’à 24 heures.",
  "Bonus de pointage quotidien : de 20 à 50 XOF, disponible une fois toutes les 24 heures.",
  "Avant de confirmer une demande, vérifiez les coordonnées du portefeuille et le montant net affiché.",
];

export function Professional() {
  return (
    <main className="cp-preview-frame">
      <PreviewDashboard />
      <div className="cp-pro-overlay">
        <section className="cp-pro-dialog" aria-labelledby="cp-pro-title" aria-describedby="cp-pro-description">
          <img className="cp-pro-brand-logo" src={chargePointLogo} alt="Logo ChargePoint" />
          <div className="cp-pro-mark" aria-hidden="true"><Bell size={31} /></div>
          <div className="cp-pro-scroll">
            <h2 id="cp-pro-title">Message de bienvenue ChargePoint</h2>
            <p id="cp-pro-description" className="cp-pro-description">
              Bienvenue sur ChargePoint. Avant toute opération, veuillez consulter les principales conditions applicables aux dépôts, aux retraits et aux bonus.
            </p>
            <ol className="cp-pro-rules">
              {rules.map((rule) => <li key={rule}>{rule}</li>)}
            </ol>
          </div>
          <footer className="cp-pro-actions">
            <a href="#telegram" onClick={(event) => event.preventDefault()}>
              <Send size={17} aria-hidden="true" />
              <span>Rejoindre le groupe Telegram officiel</span>
              <ChevronRight size={18} aria-hidden="true" />
            </a>
            <button type="button">D’ACCORD</button>
          </footer>
        </section>
      </div>
    </main>
  );
}

function PreviewDashboard() {
  return (
    <div className="cp-preview-dashboard" aria-hidden="true">
      <header className="cp-preview-header">
        <span className="cp-preview-logo"><span>CP</span></span>
        <strong>ChargePoint</strong>
        <span className="cp-preview-avatar">A</span>
      </header>
      <section className="cp-preview-hero">
        <div>
          <small>RECHARGEZ EN TOUTE SIMPLICITÉ</small>
          <h1>Votre espace<br />ChargePoint</h1>
          <p>Gérez vos services et suivez votre activité.</p>
        </div>
        <div className="cp-preview-charger"><span /></div>
      </section>
      <div className="cp-preview-shortcuts">
        <span>Dépôt</span><span>Retrait</span><span>Assistance</span>
      </div>
      <section className="cp-preview-balance">
        <small>APERÇU DU COMPTE</small>
        <strong>Solde disponible</strong>
        <div>•••••• FCFA</div>
      </section>
      <section className="cp-preview-cards">
        <span>Mes activités</span><span>Nos partenaires</span>
      </section>
      <nav className="cp-preview-nav"><span>Accueil</span><span>Services</span><span>Compte</span></nav>
    </div>
  );
}