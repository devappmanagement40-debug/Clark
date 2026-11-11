import { useState, useEffect, type FormEvent } from "react";
import { useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUiPreview, useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
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

const PHONE_REQUIRED_MESSAGE = "Veuillez d’abord renseigner votre numéro de téléphone.";

function createPreviewOtp(previousCode: string) {
  const randomValue = new Uint32Array(1);
  let nextCode = "";

  do {
    window.crypto.getRandomValues(randomValue);
    nextCode = (randomValue[0] % 1_000_000).toString().padStart(6, "0");
  } while (nextCode === previousCode);

  return nextCode;
}

const registerSchema = z.object({
  phone: z.string().trim()
    .min(1, PHONE_REQUIRED_MESSAGE)
    .min(8, "Numéro de téléphone invalide"),
  country: z.string().min(2, "Sélectionnez un pays"),
  password: z.string().min(6, "Au moins 6 caractères"),
  confirmPassword: z.string().min(1, "Confirmez le mot de passe"),
  invitationCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const { register } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [demoOtpInput, setDemoOtpInput] = useState("");
  const [demoOtpRequestedFor, setDemoOtpRequestedFor] = useState("");
  const [demoOtpError, setDemoOtpError] = useState("");
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const isDemoOtpEnabled = import.meta.env.DEV;
  const params = new URLSearchParams(searchString);
  // Referral links use /html/register?code=ABC123.
  const currentInvitationMatch = searchString.match(/[?&]code=([^&?#]+)/i);
  const refCode = currentInvitationMatch?.[1]
    || params.get("money")
    || params.get("reg")
    || params.get("code")
    || "";

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      phone: "",
      country: "CI",
      password: "",
      confirmPassword: "",
      invitationCode: refCode,
    },
  });

  const { data: apiCountries, isLoading: countriesLoading } = useQuery<ApiCountry[]>({
    queryKey: ["/api/countries"],
    enabled: !isUiPreview,
  });

  const selectedCountry = form.watch("country");

  useEffect(() => {
    if (!apiCountries || apiCountries.length === 0) return;
    const availableCountries = apiCountries.filter(ac => ac.isActive && isAuthCountryAllowed(ac.code));
    const isValid = availableCountries.some(ac => ac.code === selectedCountry);
    if (!isValid) {
      const first = availableCountries[0];
      if (first) form.setValue("country", first.code);
    }
  }, [apiCountries, selectedCountry, form]);

  const countryData = (() => {
    if (apiCountries !== undefined) {
      const c = apiCountries.find(ac =>
        ac.code === selectedCountry && ac.isActive && isAuthCountryAllowed(ac.code),
      );
      if (c) return { phonePrefix: c.phonePrefix, name: c.name };
      return null;
    }
    const f = FALLBACK_COUNTRIES.find(fc =>
      fc.code === selectedCountry && isAuthCountryAllowed(fc.code),
    );
    return f ? { phonePrefix: f.phonePrefix, name: f.name } : null;
  })();

  function clearDemoOtp() {
    setDemoOtpInput("");
    setDemoOtpRequestedFor("");
    setDemoOtpError("");
  }

  async function onSubmit(data: RegisterForm) {
    if (isUiPreview) {
      toast({
        title: "Aperçu visuel uniquement",
        description: "L’inscription réelle n’est pas activée dans cet aperçu.",
      });
      return;
    }

    setIsLoading(true);
    try {
      await register({
        fullName: `User_${data.phone}`,
        phone: data.phone,
        country: data.country,
        password: data.password,
        invitationCode: data.invitationCode,
        otpCode: isDemoOtpEnabled ? demoOtpInput : undefined,
      });
      toast({ title: "Inscription réussie !", description: "Bienvenue sur DULUX DT !" });
      navigate("/");
    } catch (error: any) {
      toast({ title: "Inscription impossible", description: error.message || "Vérifiez vos informations et réessayez.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  function handleRegisterSubmit(event: FormEvent<HTMLFormElement>) {
    const phone = form.getValues("phone").trim();
    const country = form.getValues("country");
    if (!phone) {
      event.preventDefault();
      form.setError("phone", { type: "manual", message: PHONE_REQUIRED_MESSAGE });
      form.setFocus("phone");
      return;
    }

    if (!isUiPreview && isDemoOtpEnabled) {
      const target = `${country}:${phone}`;
      if (demoOtpRequestedFor !== target || !/^\d{6}$/.test(demoOtpInput)) {
        event.preventDefault();
        setDemoOtpError("Demandez d’abord un nouveau code OTP pour ce numéro.");
        return;
      }
    }

    void form.handleSubmit(onSubmit)(event);
  }

  async function requestDemoOtp() {
    const phone = form.getValues("phone").trim();
    const country = form.getValues("country");
    if (!phone) {
      form.setError("phone", { type: "manual", message: PHONE_REQUIRED_MESSAGE });
      form.setFocus("phone");
      return;
    }

    form.clearErrors("phone");
    setDemoOtpError("");
    const target = `${country}:${phone}`;

    if (isUiPreview) {
      setDemoOtpInput(createPreviewOtp(demoOtpInput));
      setDemoOtpRequestedFor(target);
      return;
    }

    setIsRequestingOtp(true);
    try {
      const response = await apiRequest("POST", "/api/auth/demo-otp", { phone, country });
      const result = await response.json();
      if (typeof result.demoCode !== "string" || !/^\d{6}$/.test(result.demoCode)) {
        throw new Error("Le code OTP de démonstration est invalide.");
      }
      setDemoOtpInput(result.demoCode);
      setDemoOtpRequestedFor(target);
      toast({
        title: "Code OTP de démonstration",
        description: "Le code a été rempli automatiquement. Aucun SMS n’a été envoyé.",
      });
    } catch (error: any) {
      setDemoOtpError(error.message || "Impossible de générer le code OTP.");
    } finally {
      setIsRequestingOtp(false);
    }
  }

  const displayedPrefix = countryData?.phonePrefix || (countriesLoading ? "..." : "");

  return (
    <main className="auth-reference auth-register">
      {isUiPreview && (
        <aside className="auth-preview-notice" role="status">
          Aperçu visuel uniquement · SMS et inscription non activés
        </aside>
      )}
      <header className="auth-dulux__hero">
        <img className="auth-dulux__art" src={duluxSignupHero} alt="" aria-hidden="true" />
        <div className="auth-dulux__seal" aria-hidden="true">
          <img className="auth-dulux__seal-logo" src={duluxLogo} alt="" />
        </div>
      </header>
      <div className="auth-screen">
        <section className="auth-panel" aria-labelledby="register-title">
          <header className="auth-brand">
            <h1 id="register-title" className="auth-dulux__heading">
              Créez votre compte
            </h1>
          </header>
          <form onSubmit={handleRegisterSubmit}>
            <input type="hidden" {...form.register("country")} />

            <div className="auth-fields">
               <div className={`auth-field${form.formState.errors.phone || form.formState.errors.country ? " has-error" : ""}`}>
                 <button type="button" className="auth-prefix" onClick={() => setCountryModalOpen(true)} data-testid="button-select-country" aria-label={`Choisir le pays${countryData ? `, ${countryData.name}, indicatif +${displayedPrefix}` : ""}`} aria-haspopup="dialog" aria-expanded={countryModalOpen} aria-describedby={form.formState.errors.country ? "register-country-error" : undefined}>
                    <Smartphone aria-hidden="true" />
                  <span>+{displayedPrefix}</span>
                   <ChevronDown className="auth-country-arrow" aria-hidden="true" />
                </button>
                  <input {...form.register("phone", { onChange: event => {
                    const nextPhone = event.currentTarget.value.trim();
                    if (nextPhone) form.clearErrors("phone");
                    if (demoOtpRequestedFor && demoOtpRequestedFor !== `${selectedCountry}:${nextPhone}`) {
                      clearDemoOtp();
                    }
                  } })} type="tel" inputMode="tel" autoComplete="username" placeholder="Entrez votre numéro de téléphone" aria-label="Numéro de téléphone" aria-invalid={!!form.formState.errors.phone} aria-describedby={form.formState.errors.phone ? "register-phone-error" : undefined} data-testid="input-phone" />
              </div>
               {form.formState.errors.country && <p id="register-country-error" role="alert" className="auth-error">{form.formState.errors.country.message}</p>}
               {form.formState.errors.phone && <p id="register-phone-error" role="alert" className="auth-error">{form.formState.errors.phone.message}</p>}

               <div className={`auth-field${form.formState.errors.password ? " has-error" : ""}`}>
                 <svg className="auth-field-icon auth-solid-lock" viewBox="0 0 24 24" aria-hidden="true">
                   <path d="M7 10V7a5 5 0 0 1 10 0v3h1.25A2.75 2.75 0 0 1 21 12.75v7.5A2.75 2.75 0 0 1 18.25 23h-12.5A2.75 2.75 0 0 1 3 20.25v-7.5A2.75 2.75 0 0 1 5.75 10H7Zm2.2 0h5.6V7a2.8 2.8 0 0 0-5.6 0v3Z" />
                   <circle cx="12" cy="16" r="1.35" fill="#fff" />
                   <path d="M11.3 16h1.4l.55 2.8h-2.5l.55-2.8Z" fill="#fff" />
                 </svg>
                  <input {...form.register("password")} type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Entrez votre mot de passe" aria-label="Mot de passe" aria-invalid={!!form.formState.errors.password} aria-describedby={form.formState.errors.password ? "register-password-error" : undefined} data-testid="input-password" />
                  <button type="button" className="auth-password-toggle" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"} aria-pressed={showPassword}>
                    {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                  </button>
              </div>
               {form.formState.errors.password && <p id="register-password-error" role="alert" className="auth-error">{form.formState.errors.password.message}</p>}

               <div className={`auth-field${form.formState.errors.confirmPassword ? " has-error" : ""}`}>
                 <svg className="auth-field-icon auth-solid-lock" viewBox="0 0 24 24" aria-hidden="true">
                   <path d="M7 10V7a5 5 0 0 1 10 0v3h1.25A2.75 2.75 0 0 1 21 12.75v7.5A2.75 2.75 0 0 1 18.25 23h-12.5A2.75 2.75 0 0 1 3 20.25v-7.5A2.75 2.75 0 0 1 5.75 10H7Zm2.2 0h5.6V7a2.8 2.8 0 0 0-5.6 0v3Z" />
                   <circle cx="12" cy="16" r="1.35" fill="#fff" />
                   <path d="M11.3 16h1.4l.55 2.8h-2.5l.55-2.8Z" fill="#fff" />
                 </svg>
                  <input {...form.register("confirmPassword")} type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" placeholder="Saisissez à nouveau le mot de passe" aria-label="Confirmer le mot de passe" aria-invalid={!!form.formState.errors.confirmPassword} aria-describedby={form.formState.errors.confirmPassword ? "register-confirm-error" : undefined} data-testid="input-confirm-password" />
                  <button type="button" className="auth-password-toggle" onClick={() => setShowConfirmPassword(value => !value)} aria-label={showConfirmPassword ? "Masquer la confirmation du mot de passe" : "Afficher la confirmation du mot de passe"} aria-pressed={showConfirmPassword}>
                    {showConfirmPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                  </button>
              </div>
               {form.formState.errors.confirmPassword && <p id="register-confirm-error" role="alert" className="auth-error">{form.formState.errors.confirmPassword.message}</p>}

              <div className="auth-field">
                 <svg className="auth-field-icon auth-solid-user" viewBox="0 0 24 24" aria-hidden="true">
                   <circle cx="12" cy="7" r="4" />
                   <path d="M4 21v-1.2A7.8 7.8 0 0 1 11.8 12h.4a7.8 7.8 0 0 1 7.8 7.8V21H4Z" />
                 </svg>
                  <span className="auth-invitation-prefix" aria-hidden="true">+</span>
                  <input {...form.register("invitationCode")} placeholder="Code d'invitation" aria-label="Code d'invitation" data-testid="input-invitation-code" />
              </div>

              {(isUiPreview || isDemoOtpEnabled) && (
                <div className="auth-field auth-otp-field">
                  <svg className="auth-field-icon auth-solid-lock" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7 10V7a5 5 0 0 1 10 0v3h1.25A2.75 2.75 0 0 1 21 12.75v7.5A2.75 2.75 0 0 1 18.25 23h-12.5A2.75 2.75 0 0 1 3 20.25v-7.5A2.75 2.75 0 0 1 5.75 10H7Zm2.2 0h5.6V7a2.8 2.8 0 0 0-5.6 0v3Z" />
                    <circle cx="12" cy="16" r="1.35" fill="#fff" />
                    <path d="M11.3 16h1.4l.55 2.8h-2.5l.55-2.8Z" fill="#fff" />
                  </svg>
                  <input
                    value={demoOtpInput}
                    onChange={event => {
                      setDemoOtpInput(event.target.value.replace(/\D/g, "").slice(0, 6));
                      setDemoOtpError("");
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="Entrez le code OTP"
                    aria-label="Code OTP"
                    data-testid="input-otp"
                  />
                  <button
                    type="button"
                    className="auth-otp-action"
                    onClick={requestDemoOtp}
                    disabled={isRequestingOtp}
                    aria-label="Remplir le code OTP de démonstration sans SMS"
                    data-testid="button-request-otp"
                  >
                    {isRequestingOtp ? "..." : "OTP"}
                  </button>
                </div>
              )}
              {demoOtpError && <p role="alert" className="auth-error">{demoOtpError}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="auth-submit" data-testid="button-register">
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "S’inscrire"}
            </button>
            <button type="button" className="auth-switch" onClick={() => navigate("/login")} data-testid="link-login">J’ai déjà un compte</button>
          </form>
        </section>
      </div>

      <CountrySelector selectedCountryCode={selectedCountry} open={countryModalOpen} onClose={() => setCountryModalOpen(false)} onSelect={(code) => {
        if (code !== selectedCountry) clearDemoOtp();
        form.setValue("country", code, { shouldValidate: true });
      }} excludedCountryCodes={AUTH_HIDDEN_COUNTRY_CODES} />
    </main>
  );
}
