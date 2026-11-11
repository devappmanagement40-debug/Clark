import { useState } from "react";
import { Check, ChevronDown, Eye, EyeOff, LockKeyhole, Search, UserRoundPlus, X } from "lucide-react";
import "./_group.css";

const countries = [
  { code: "TG", name: "Togo", prefix: "228", flag: "🇹🇬" },
  { code: "CI", name: "Côte d’Ivoire", prefix: "225", flag: "🇨🇮" },
  { code: "BF", name: "Burkina Faso", prefix: "226", flag: "🇧🇫" },
  { code: "NE", name: "Niger", prefix: "227", flag: "🇳🇪" },
  { code: "BJ", name: "Bénin", prefix: "229", flag: "🇧🇯" },
];

export function DuluxRegister() {
  const [selectedCountry, setSelectedCountry] = useState(countries[1]);
  const [countryOpen, setCountryOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [otp, setOtp] = useState("");
  const filteredCountries = countries.filter(country =>
    country.name.toLocaleLowerCase().includes(search.toLocaleLowerCase())
      || country.prefix.includes(search),
  );

  return (
    <main className="dulux-signup">
      <div className="dulux-signup__preview-note">Maquette visuelle · code OTP de démonstration</div>
      <header className="dulux-signup__hero">
        <img className="dulux-signup__art" src="/__mockup/images/dulux-signup-hero.png" alt="" aria-hidden="true" />
        <div className="dulux-signup__seal" aria-hidden="true">
          <img src="/__mockup/images/dulux-logo.png" alt="" />
        </div>
      </header>

      <section className="dulux-signup__content" aria-labelledby="dulux-signup-title">
        <h1 id="dulux-signup-title">Créez votre compte</h1>
        <form onSubmit={event => event.preventDefault()}>
          <div className="dulux-signup__fields">
            <div className="dulux-signup__field dulux-signup__phone">
              <button type="button" onClick={() => setCountryOpen(true)} aria-label={`Choisir le pays, ${selectedCountry.name}, indicatif +${selectedCountry.prefix}`}>
                <span>+{selectedCountry.prefix}</span>
                <ChevronDown aria-hidden="true" />
              </button>
              <input type="tel" inputMode="tel" placeholder="Entrez votre numéro de téléphone" aria-label="Numéro de téléphone" />
            </div>

            <div className="dulux-signup__field">
              <LockKeyhole aria-hidden="true" />
              <input type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Entrez votre mot de passe" aria-label="Mot de passe" />
              <button type="button" className="dulux-signup__toggle" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
                {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </button>
            </div>

            <div className="dulux-signup__field">
              <LockKeyhole aria-hidden="true" />
              <input type={showConfirm ? "text" : "password"} autoComplete="new-password" placeholder="Saisissez à nouveau le mot de passe" aria-label="Confirmer le mot de passe" />
              <button type="button" className="dulux-signup__toggle" onClick={() => setShowConfirm(value => !value)} aria-label={showConfirm ? "Masquer la confirmation" : "Afficher la confirmation"}>
                {showConfirm ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </button>
            </div>

            <div className="dulux-signup__field">
              <UserRoundPlus aria-hidden="true" />
              <span className="dulux-signup__invite-mark" aria-hidden="true">+</span>
              <input placeholder="Code d’invitation" aria-label="Code d’invitation" />
            </div>

            <div className="dulux-signup__field dulux-signup__otp">
              <LockKeyhole aria-hidden="true" />
              <input
                value={otp}
                onChange={event => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Entrez le code OTP"
                aria-label="Code OTP"
              />
              <button type="button" onClick={() => setOtp("532206")} aria-label="Remplir le code OTP de démonstration">OTP</button>
            </div>
          </div>

          <button className="dulux-signup__submit" type="button">S’inscrire</button>
          <button className="dulux-signup__login" type="button">J’ai déjà un compte</button>
        </form>
      </section>

      {countryOpen && (
        <div className="dulux-signup__sheet-backdrop" role="presentation" onClick={() => setCountryOpen(false)}>
          <section className="dulux-signup__sheet" role="dialog" aria-modal="true" aria-labelledby="dulux-country-title" onClick={event => event.stopPropagation()}>
            <header>
              <h2 id="dulux-country-title">Choisir un pays</h2>
              <button type="button" onClick={() => setCountryOpen(false)} aria-label="Fermer"><X aria-hidden="true" /></button>
            </header>
            <label className="dulux-signup__country-search">
              <Search aria-hidden="true" />
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Rechercher un pays ou un indicatif" />
            </label>
            <div className="dulux-signup__country-list">
              {filteredCountries.map(country => (
                <button key={country.code} type="button" className={country.code === selectedCountry.code ? "is-selected" : ""} onClick={() => { setSelectedCountry(country); setCountryOpen(false); setSearch(""); }}>
                  <span>{country.flag}</span>
                  <span>{country.name}</span>
                  <span>+{country.prefix}</span>
                  {country.code === selectedCountry.code && <Check aria-label="Sélectionné" />}
                </button>
              ))}
              {filteredCountries.length === 0 && <p>Aucun pays trouvé.</p>}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
