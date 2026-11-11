import { getWithdrawalMethods } from "@shared/withdrawal-methods";
import { getActiveCountryMethodNames } from "@shared/country-methods";

export const AUTH_HIDDEN_COUNTRY_CODES: readonly string[] = [];

export function isAuthCountryAllowed(countryCode: string): boolean {
  return !AUTH_HIDDEN_COUNTRY_CODES.includes(countryCode.toUpperCase());
}

// The API remains authoritative. These bootstrap entries are used only when its
// request fails so public country pickers do not become unusable during an outage.
export const COUNTRIES: Array<{
  code: string;
  name: string;
  flag: string;
  currency: string;
  paymentMethods: string[];
}> = [];

export const FALLBACK_COUNTRIES: Array<{
  code: string;
  name: string;
  currency: string;
  phonePrefix: string;
  operators: string[];
  withdrawalMethods: string[];
}> = [
  { code: "TG", name: "Togo", currency: "XOF", phonePrefix: "228", operators: ["Togocel", "Moov Africa Togo"], withdrawalMethods: ["Togocel", "Moov Africa Togo"] },
  { code: "CI", name: "Côte d'Ivoire", currency: "XOF", phonePrefix: "225", operators: [], withdrawalMethods: ["Wave"] },
  { code: "BF", name: "Burkina Faso", currency: "XOF", phonePrefix: "226", operators: ["Orange Burkina", "Moov Africa Burkina"], withdrawalMethods: ["Orange Burkina", "Moov Africa Burkina"] },
  { code: "NE", name: "Niger", currency: "XOF", phonePrefix: "227", operators: ["NITA TRANSFERT", "AMANA TRANSFERT"], withdrawalMethods: ["Airtel Money", "Wave", "NITA TRANSFERT"] },
  { code: "BJ", name: "Bénin", currency: "XOF", phonePrefix: "229", operators: ["MTN Bénin", "Moov Africa Bénin"], withdrawalMethods: ["MTN Bénin", "Moov Africa Bénin"] },
];

// Legacy compatibility - kept for places still using ELIGIBLE_COUNTRIES directly
export const ELIGIBLE_COUNTRIES = FALLBACK_COUNTRIES.map(c => ({
  code: c.code,
  name: c.name,
  flag: c.code,
  currency: c.currency,
  phonePrefix: c.phonePrefix,
  paymentMethods: c.operators,
})) as readonly { code: string; name: string; flag: string; currency: string; phonePrefix: string; paymentMethods: readonly string[] }[];

export type ApiCountry = {
  id: number;
  code: string;
  name: string;
  currency: string;
  phonePrefix: string;
  operators: string; // JSON string
  withdrawalMethods?: string | null; // JSON string; null is supported for legacy rows
  isActive: boolean;
};

export const FALLBACK_API_COUNTRIES: ApiCountry[] = FALLBACK_COUNTRIES.map((country, index) => ({
  id: index + 1,
  code: country.code,
  name: country.name,
  currency: country.currency,
  phonePrefix: country.phonePrefix,
  operators: JSON.stringify(country.operators),
  withdrawalMethods: JSON.stringify(country.withdrawalMethods),
  isActive: true,
}));

export function getCountriesForDisplay(
  apiCountries: ApiCountry[] | undefined,
  apiFailed = false,
): ApiCountry[] {
  return apiFailed ? FALLBACK_API_COUNTRIES : apiCountries ?? [];
}

export function parseOperators(operatorsJson: string): string[] {
  return getActiveCountryMethodNames(operatorsJson);
}

export function getCountryByCode(code: string, apiCountries?: ApiCountry[]) {
  if (apiCountries !== undefined) {
    // API data is loaded — only use it, never fall back to hardcoded data
    // This ensures disabled countries and updated operators are respected
    const c = apiCountries.find(c => c.code === code && c.isActive);
    if (!c) return undefined;
    return {
      code: c.code,
      name: c.name,
      currency: c.currency,
      phonePrefix: c.phonePrefix,
      paymentMethods: parseOperators(c.operators),
      withdrawalMethods: c.withdrawalMethods == null
        ? undefined
        : parseOperators(c.withdrawalMethods),
    };
  }
  // API not yet loaded — use hardcoded fallback temporarily
  const fallback = FALLBACK_COUNTRIES.find(c => c.code === code);
  if (!fallback) return undefined;
  return {
    code: fallback.code,
    name: fallback.name,
    currency: fallback.currency,
    phonePrefix: fallback.phonePrefix,
    paymentMethods: fallback.operators,
    withdrawalMethods: fallback.withdrawalMethods,
  };
}

export function getPaymentMethodsForCountry(code: string, apiCountries?: ApiCountry[]): string[] {
  const country = getCountryByCode(code, apiCountries);
  return country ? [...country.paymentMethods] : [];
}

export function getWithdrawalMethodsForCountry(code: string, apiCountries?: ApiCountry[]): string[] {
  const country = getCountryByCode(code, apiCountries);
  return country
    ? getWithdrawalMethods(country.code, country.withdrawalMethods ?? country.paymentMethods)
    : [];
}

export function formatCurrency(amount: number, countryCode: string, apiCountries?: ApiCountry[]): string {
  const country = getCountryByCode(countryCode, apiCountries);
  const currency = country?.currency || "FCFA";
  return `${amount.toLocaleString()} ${currency}`;
}
