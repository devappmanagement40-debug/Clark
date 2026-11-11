import { ChevronRight, Send, Zap } from "lucide-react";
import "./_group.css";
import "./welcome.css";

const currentIntro =
  "Bienvenue sur ChargePoint. Avant toute opération, veuillez consulter les principales conditions applicables aux dépôts, aux retraits et aux bonus.";

const currentItems = [
  "Montant minimum du dépôt : 3 500 XOF.",
  "Montant minimum du retrait : 1 200 XOF.",
  "Frais de retrait : 20 % du montant demandé. Le montant net estimé après frais est affiché avant validation.",
  "Nombre maximal de demandes de retrait par jour : 1.",
  "Horaires de retrait : de 9 h à 17 h.",
  "Délai de traitement : généralement sous 2 heures et, exceptionnellement, jusqu’à 24 heures.",
  "Bonus de pointage quotidien : de 20 à 50 XOF, disponible une fois toutes les 24 heures.",
  "Avant de confirmer une demande, vérifiez les coordonnées du portefeuille et le montant net affiché.",
];

export function Current() {
  return (
    <main className="cp-preview-frame">
      <PreviewDashboard />
      <div className="cp-current-overlay">
        <section className="cp-current-dialog" aria-labelledby="cp-current-title">
          <div className="cp-current-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" focusable="false">
              <path d="M16 3.5c-5.1 0-8 3.8-8 9v4.6l-2.1 3v1.4h20.2v-1.4l-2.1-3v-4.6c0-5.2-2.9-9-8-9Z" />
            </svg>
            <span />
          </div>
          <div className="cp-current-copy">
            <h2 id="cp-current-title" className="cp-current-title">Message de bienvenue ChargePoint</h2>
            <p className="cp-current-message">{currentIntro}</p>
            <ol className="cp-current-list">
              {currentItems.map((item) => <li key={item}>{item}</li>)}
            </ol>
          </div>
          <div className="cp-current-actions">
            <a href="#telegram" onClick={(event) => event.preventDefault()}>
              <Send size={15} aria-hidden="true" />
              <span>Rejoindre le groupe Telegram Officiel</span>
              <ChevronRight size={17} aria-hidden="true" />
            </a>
            <button type="button">D’ACCORD</button>
          </div>
        </section>
      </div>
    </main>
  );
}

export function PreviewDashboard() {
  return (
    <div className="cp-preview-dashboard" aria-hidden="true">
      <header className="cp-preview-header">
        <span className="cp-preview-logo"><Zap size={17} aria-hidden="true" /></span>
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