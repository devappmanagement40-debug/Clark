export const DEFAULT_CLAPAY_PAYOUT_COUNTRIES = ["NE", "BF"] as const;

export type ClapayPayoutCountry = {
  code: string;
  isActive: boolean;
};

export function deriveClapayPayoutCountries(
  countries: ClapayPayoutCountry[],
  depositRouting: Record<string, string[]>,
  clapayEnabled: boolean,
): string[] {
  if (!clapayEnabled) return [];

  return countries
    .filter((country) => {
      const code = country.code.trim().toUpperCase();
      return country.isActive
        && /^[A-Z]{2}$/.test(code)
        && (depositRouting[code] || []).includes("clapay");
    })
    .map((country) => country.code.trim().toUpperCase());
}

export function parseClapayPayoutCountries(raw: string | undefined): string[] {
  if (raw === undefined || raw.trim() === "") {
    return [...DEFAULT_CLAPAY_PAYOUT_COUNTRIES];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("La configuration des pays de retrait Clapay est invalide");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("La configuration des pays de retrait Clapay doit être une liste JSON");
  }

  const countries: string[] = [];
  for (const value of parsed) {
    if (typeof value !== "string") {
      throw new Error("Chaque pays de retrait Clapay doit être un code pays");
    }
    const code = value.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(code)) {
      throw new Error(`Code pays Clapay invalide : ${value}`);
    }
    if (!countries.includes(code)) countries.push(code);
  }

  return countries;
}
