import { ChevronRight, Send } from "lucide-react";
import { PreviewDashboard } from "./Current";
import "./_group.css";
import "./welcome.css";

export function ChargePointReference() {
  return (
    <main className="cp-preview-frame">
      <PreviewDashboard />
      <div className="cp-reference-overlay">
        <section className="cp-reference-dialog" role="dialog" aria-modal="true" aria-labelledby="cp-reference-title">
          <div className="cp-reference-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" focusable="false">
              <path d="M16 3.5c-5.1 0-8 3.8-8 9v4.6l-2.1 3v1.4h20.2v-1.4l-2.1-3v-4.6c0-5.2-2.9-9-8-9Z" />
            </svg>
            <span />
          </div>
          <h1 id="cp-reference-title" className="sr-only">Message de bienvenue ChargePoint</h1>
          <p className="cp-reference-message">
            ChargePoint facilite la recharge de votre véhicule électrique au quotidien.
            {"\n\n"}1. Accédez aux services de recharge.
            {"\n"}2. Suivez votre compte simplement.
            {"\n"}3. Retrouvez l’assistance.
            {"\n"}4. Découvrez les nouveautés.
          </p>
          <div className="cp-reference-actions">
            <a className="cp-reference-telegram" href="#telegram" onClick={(event) => event.preventDefault()}>
              <Send size={19} aria-hidden="true" />
              <span>Rejoindre le groupe Telegram Officiel</span>
              <ChevronRight size={21} aria-hidden="true" />
            </a>
            <button className="cp-reference-close" type="button">D’ACCORD</button>
          </div>
        </section>
      </div>
    </main>
  );
}