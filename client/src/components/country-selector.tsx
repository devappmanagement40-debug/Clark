import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FALLBACK_API_COUNTRIES, type ApiCountry } from "@/lib/countries";
import { Loader2, Search, X } from "lucide-react";

interface CountrySelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (countryCode: string) => void;
  selectedCountryCode?: string;
  allowedCountryCodes?: readonly string[];
  excludedCountryCodes?: readonly string[];
  includeInactive?: boolean;
}

function CountryFlag({ code }: { code: string }) {
  const normalizedCode = code.toUpperCase();

  switch (normalizedCode) {
    case "TG":
      return (
        <svg className="country-picker-flag" viewBox="0 0 60 40" aria-hidden="true">
          <rect width="60" height="40" fill="#006a4e" />
          <path d="M0 8h60v8H0zM0 24h60v8H0z" fill="#ffce00" />
          <path d="M0 0h24v16H0z" fill="#d21034" />
          <path d="m12 2.5 2.1 4.3 4.8.7-3.5 3.4.8 4.8-4.2-2.3-4.2 2.3.8-4.8L5.1 7.5l4.8-.7z" fill="#fff" />
        </svg>
      );
    case "CI":
      return (
        <svg className="country-picker-flag" viewBox="0 0 60 40" aria-hidden="true">
          <path fill="#f77f00" d="M0 0h20v40H0z" />
          <path fill="#fff" d="M20 0h20v40H20z" />
          <path fill="#009a44" d="M40 0h20v40H40z" />
        </svg>
      );
    case "BF":
      return (
        <svg className="country-picker-flag" viewBox="0 0 60 40" aria-hidden="true">
          <path fill="#ef2b2d" d="M0 0h60v20H0z" />
          <path fill="#009e49" d="M0 20h60v20H0z" />
          <path fill="#fcd116" d="m30 11 2.4 5h5.5l-4.4 3.4 1.7 5.3-5.2-3.1-5.2 3.1 1.7-5.3-4.4-3.4h5.5z" />
        </svg>
      );
    case "NE":
      return (
        <svg className="country-picker-flag" viewBox="0 0 60 40" aria-hidden="true">
          <path fill="#e05206" d="M0 0h60v13.33H0z" />
          <path fill="#fff" d="M0 13.33h60v13.34H0z" />
          <path fill="#0db02b" d="M0 26.67h60V40H0z" />
          <circle cx="30" cy="20" r="6.5" fill="#e05206" />
        </svg>
      );
    case "BJ":
      return (
        <svg className="country-picker-flag" viewBox="0 0 60 40" aria-hidden="true">
          <path fill="#008751" d="M0 0h24v40H0z" />
          <path fill="#fcd116" d="M24 0h36v20H24z" />
          <path fill="#e8112d" d="M24 20h36v20H24z" />
        </svg>
      );
    default:
      return <span className="country-picker-flag-fallback" aria-hidden="true">{normalizedCode}</span>;
  }
}

function normalizeSearchText(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
}

export function CountrySelector({
  open,
  onClose,
  onSelect,
  selectedCountryCode,
  allowedCountryCodes,
  excludedCountryCodes = [],
  includeInactive = false,
}: CountrySelectorProps) {
  const [search, setSearch] = useState("");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const { data: apiCountries, isLoading, isError } = useQuery<ApiCountry[]>({
    queryKey: [includeInactive ? "/api/login/countries" : "/api/countries"],
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousBodyOverflow = document.body.style.overflow;
    const touchDevice = window.matchMedia("(pointer: coarse)").matches;
    document.body.style.overflow = "hidden";
    (touchDevice ? closeButtonRef.current : searchInputRef.current)?.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setSearch("");
        onCloseRef.current();
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLButtonElement | HTMLInputElement>("button, input");
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;

  const closePicker = () => {
    setSearch("");
    onClose();
  };

  const countrySource = isError ? FALLBACK_API_COUNTRIES : apiCountries || [];
  const allowedCodes = allowedCountryCodes
    ? new Set(allowedCountryCodes.map(code => code.toUpperCase()))
    : null;
  const excludedCodes = new Set(excludedCountryCodes.map(code => code.toUpperCase()));
  const countries = countrySource
    .filter(c =>
      (includeInactive || c.isActive) &&
      (!allowedCodes || allowedCodes.has(c.code.toUpperCase())) &&
      !excludedCodes.has(c.code.toUpperCase()),
    )
    .map(c => ({ code: c.code, name: c.name, phonePrefix: c.phonePrefix, isActive: c.isActive }))
    .filter(country => {
      const query = normalizeSearchText(search.trim());
      return !query || normalizeSearchText(country.name).includes(query) || country.phonePrefix.includes(query);
    });

  return (
    <div className="country-picker-overlay shared-country-selector" onClick={closePicker}>
      <section
        ref={dialogRef}
        className="country-picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby="country-picker-heading"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="country-picker-header">
          <h2 id="country-picker-heading">Sélectionnez un pays</h2>
          <button ref={closeButtonRef} type="button" className="country-picker-close" onClick={closePicker} aria-label="Fermer">
            <X aria-hidden="true" />
          </button>
        </div>
        <div className="country-picker-search">
          <Search aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un pays..."
            aria-label="Rechercher un pays"
          />
        </div>
        <div className="country-picker-list">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Chargement des pays...</span>
            </div>
          ) : countries.map((country) => {
            const selected = country.code === selectedCountryCode;
            return (
              <button
                type="button"
                key={country.code}
                className={`country-picker-row${selected ? " is-selected" : ""}`}
                onClick={() => { onSelect(country.code); closePicker(); }}
                aria-pressed={selected}
                data-testid={`country-option-${country.code}`}
              >
                <CountryFlag code={country.code} />
                <span className="country-picker-name">
                  {country.name}{includeInactive && !country.isActive ? " (connexion uniquement)" : ""}
                </span>
                <span className="country-picker-prefix">+{country.phonePrefix}</span>
              </button>
            );
          })}
          {!isLoading && isError && (
            <p className="country-picker-empty" role="status">
              Liste locale temporaire : le serveur des pays ne répond pas.
            </p>
          )}
          {!isLoading && countries.length === 0 && <p className="country-picker-empty">{search ? "Aucun résultat" : "Aucun pays disponible"}</p>}
        </div>
        {includeInactive && (
          <p className="country-picker-empty">
            Les pays désactivés restent disponibles pour les comptes existants, mais pas pour les nouvelles inscriptions.
          </p>
        )}
      </section>
    </div>
  );
}