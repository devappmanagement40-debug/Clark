import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUiPreview, useAuth } from "@/lib/auth";
import {
  AUTH_HIDDEN_COUNTRY_CODES,
  FALLBACK_COUNTRIES,
  isAuthCountryAllowed,
  type ApiCountry,
} from "@/lib/countries";
import { CountrySelector } from "@/components/country-selector";
import { ChevronDown, Eye, EyeOff, Loader2, Smartphone } from "lucide-react";
import duluxLogo from "@/assets/images/dulux-logo.png";
import duluxSignupHero from "@/assets/images/dulux-signup-hero.png";
import "./auth-pages.css";

const loginSchema = z.object({
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  country: z.string().min(2, "Sélectionnez un pays"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      country: "CI",
      password: "",
    },
  });

  const { data: apiCountries, isLoading: countriesLoading } = useQuery<ApiCountry[]>({
    queryKey: ["/api/login/countries"],
    enabled: !isUiPreview,
  });

  const selectedCountry = form.watch("country");

  useEffect(() => {
    // Remove credentials persisted by versions that stored login data locally.
    localStorage.removeItem("doosan_credentials");
    localStorage.removeItem("doosan_login_preferences");
  }, []);

  useEffect(() => {
    if (!apiCountries || apiCountries.length === 0) return;
    const availableCountries = apiCountries.filter(ac => isAuthCountryAllowed(ac.code));
    const isValid = availableCountries.some(ac => ac.code === selectedCountry);
    if (!isValid) {
      const first = availableCountries.find(country => country.isActive) || availableCountries[0];
      if (first) form.setValue("country", first.code);
    }
  }, [apiCountries, selectedCountry, form]);

  const countryData = (() => {
    if (apiCountries !== undefined) {
      const c = apiCountries.find(ac =>
        ac.code === selectedCountry && isAuthCountryAllowed(ac.code),
      );
      if (c) return { phonePrefix: c.phonePrefix, name: c.name };
      return null;
    }
    const f = FALLBACK_COUNTRIES.find(fc =>
      fc.code === selectedCountry && isAuthCountryAllowed(fc.code),
    );
    return f ? { phonePrefix: f.phonePrefix, name: f.name } : null;
  })();

  async function onSubmit(data: LoginForm) {
    setIsLoading(true);
    try {
      await login(data.phone, data.country, data.password);
      navigate("/my-page");
    } catch (error: any) {
      toast({ title: "Connexion impossible", description: error.message || "Vérifiez votre numéro et votre mot de passe.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  const displayedPrefix = countryData?.phonePrefix || (countriesLoading ? "..." : "");

  return (
    <main className="auth-reference auth-login">
      {isUiPreview && (
        <aside className="auth-preview-notice" role="status">
          Aperçu visuel uniquement · connexion non activée
        </aside>
      )}
      <header className="auth-dulux__hero">
        <img className="auth-dulux__art" src={duluxSignupHero} alt="" aria-hidden="true" />
        <div className="auth-dulux__seal" aria-hidden="true">
          <img className="auth-dulux__seal-logo" src={duluxLogo} alt="" />
        </div>
      </header>
      <div className="auth-screen">
        <section className="auth-panel" aria-labelledby="login-title">
          <header className="auth-brand">
            <h1 id="login-title" className="auth-dulux__heading">
              Connectez-vous à votre espace
            </h1>
          </header>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <input type="hidden" {...form.register("country")} />

            <div className="auth-fields">
               <div className={`auth-field${form.formState.errors.phone || form.formState.errors.country ? " has-error" : ""}`}>
                 <button type="button" className="auth-prefix" onClick={() => setCountryModalOpen(true)} data-testid="button-select-country" aria-label={`Choisir le pays${countryData ? `, ${countryData.name}, indicatif +${displayedPrefix}` : ""}`} aria-haspopup="dialog" aria-expanded={countryModalOpen} aria-describedby={form.formState.errors.country ? "login-country-error" : undefined}>
                    <Smartphone aria-hidden="true" />
                  <span>+{displayedPrefix}</span>
                   <ChevronDown className="auth-country-arrow" aria-hidden="true" />
                </button>
                  <input {...form.register("phone")} type="tel" inputMode="tel" autoComplete="username" placeholder="Entrez votre numéro de téléphone" aria-label="Numéro de téléphone" aria-invalid={!!form.formState.errors.phone} aria-describedby={form.formState.errors.phone ? "login-phone-error" : undefined} data-testid="input-phone" />
              </div>
               {form.formState.errors.country && <p id="login-country-error" role="alert" className="auth-error">{form.formState.errors.country.message}</p>}
               {form.formState.errors.phone && <p id="login-phone-error" role="alert" className="auth-error">{form.formState.errors.phone.message}</p>}

               <div className={`auth-field${form.formState.errors.password ? " has-error" : ""}`}>
                 <svg className="auth-field-icon auth-solid-lock" viewBox="0 0 24 24" aria-hidden="true">
                   <path d="M7 10V7a5 5 0 0 1 10 0v3h1.25A2.75 2.75 0 0 1 21 12.75v7.5A2.75 2.75 0 0 1 18.25 23h-12.5A2.75 2.75 0 0 1 3 20.25v-7.5A2.75 2.75 0 0 1 5.75 10H7Zm2.2 0h5.6V7a2.8 2.8 0 0 0-5.6 0v3Z" />
                   <circle cx="12" cy="16" r="1.35" fill="#fff" />
                   <path d="M11.3 16h1.4l.55 2.8h-2.5l.55-2.8Z" fill="#fff" />
                 </svg>
                    <input {...form.register("password")} type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Entrez votre mot de passe" aria-label="Mot de passe" aria-invalid={!!form.formState.errors.password} aria-describedby={form.formState.errors.password ? "login-password-error" : undefined} data-testid="input-password" />
                    <button type="button" className="auth-password-toggle" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"} aria-pressed={showPassword}>
                      {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                    </button>
              </div>
               {form.formState.errors.password && <p id="login-password-error" role="alert" className="auth-error">{form.formState.errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isLoading || isUiPreview} className="auth-submit" data-testid="button-login">
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Se connecter"}
            </button>
             <button type="button" className="auth-switch" onClick={() => navigate("/register")} data-testid="link-register">Créer un compte</button>
          </form>
        </section>
      </div>

      <CountrySelector selectedCountryCode={selectedCountry} open={countryModalOpen} onClose={() => setCountryModalOpen(false)} onSelect={(code) => form.setValue("country", code, { shouldValidate: true })} excludedCountryCodes={AUTH_HIDDEN_COUNTRY_CODES} includeInactive />
    </main>
  );
}
