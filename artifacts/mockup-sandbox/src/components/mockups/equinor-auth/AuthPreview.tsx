import {
  ChevronDown,
  Smartphone,
} from "lucide-react";
import "./_group.css";
import "./auth-preview.css";

type AuthPreviewProps = {
  mode: "login" | "register";
  legacy?: boolean;
};

export function AuthPreview({ mode, legacy = false }: AuthPreviewProps) {
  const isRegister = mode === "register";
  const background = isRegister
    ? "/__mockup/equinor-register.jpg"
    : "/__mockup/equinor-login.jpg";

  return (
    <main
      className={`auth-preview-page ${legacy ? "auth-preview-legacy" : "auth-preview-equinor"} ${isRegister ? "auth-preview-register" : "auth-preview-login"}`}
    >
      {!legacy && (
        <>
          <img className="auth-preview-background-fill" src={background} alt="" aria-hidden="true" />
          <img className="auth-preview-background-image" src={background} alt="" aria-hidden="true" />
        </>
      )}
      <div className="auth-preview-screen">
        <section className="auth-preview-panel" aria-label={isRegister ? "Inscription Equinor" : "Connexion Equinor"}>
          {legacy && (
            <>
              <h1 className="auth-preview-brand">Equinor</h1>
              <img
                className="auth-preview-old-image"
                src="/__mockup/auth-chargepoint-combined.png"
                alt=""
              />
            </>
          )}
          <form onSubmit={(event) => event.preventDefault()}>
            <div className="auth-preview-fields">
              <div className="auth-preview-field">
                <button className="auth-preview-country" type="button" aria-label="Choisir le pays">
                  <Smartphone aria-hidden="true" />
                  <span>+225</span>
                  <ChevronDown aria-hidden="true" />
                </button>
                <input type="tel" placeholder="Entrez votre numéro de téléphone" aria-label="Numéro de téléphone" />
              </div>
              <div className="auth-preview-field">
                <svg className="auth-preview-field-icon auth-preview-lock" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M7 10V7a5 5 0 0 1 10 0v3h1.25A2.75 2.75 0 0 1 21 12.75v7.5A2.75 2.75 0 0 1 18.25 23h-12.5A2.75 2.75 0 0 1 3 20.25v-7.5A2.75 2.75 0 0 1 5.75 10H7Zm2.2 0h5.6V7a2.8 2.8 0 0 0-5.6 0v3Z" />
                  <circle cx="12" cy="16" r="1.35" fill="#fff" />
                  <path d="M11.3 16h1.4l.55 2.8h-2.5l.55-2.8Z" fill="#fff" />
                </svg>
                <input type="password" placeholder="Entrez votre mot de passe" aria-label="Mot de passe" />
              </div>
              {isRegister && (
                <>
                  <div className="auth-preview-field">
                    <svg className="auth-preview-field-icon auth-preview-lock" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M7 10V7a5 5 0 0 1 10 0v3h1.25A2.75 2.75 0 0 1 21 12.75v7.5A2.75 2.75 0 0 1 18.25 23h-12.5A2.75 2.75 0 0 1 3 20.25v-7.5A2.75 2.75 0 0 1 5.75 10H7Zm2.2 0h5.6V7a2.8 2.8 0 0 0-5.6 0v3Z" />
                      <circle cx="12" cy="16" r="1.35" fill="#fff" />
                      <path d="M11.3 16h1.4l.55 2.8h-2.5l.55-2.8Z" fill="#fff" />
                    </svg>
                    <input type="password" placeholder="Saisissez à nouveau le mot de passe" aria-label="Confirmer le mot de passe" />
                  </div>
                  <div className="auth-preview-field">
                    <svg className="auth-preview-field-icon auth-preview-user" viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="12" cy="7" r="4" />
                      <path d="M4 21v-1.2A7.8 7.8 0 0 1 11.8 12h.4a7.8 7.8 0 0 1 7.8 7.8V21H4Z" />
                    </svg>
                    <span className="auth-preview-invitation-prefix" aria-hidden="true">+</span>
                    <input placeholder="Code d’invitation" aria-label="Code d’invitation" />
                  </div>
                </>
              )}
            </div>
            <button className="auth-preview-switch" type="button">
              {isRegister ? "Aller à la connexion >" : "Aller à l'inscription >"}
            </button>
            <button className="auth-preview-submit" type="submit">
              {isRegister ? "S’inscrire" : "Se connecter"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
