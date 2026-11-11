import { normalizeCountryCode } from "./country-methods";

export const DEPOSIT_OPERATOR_PROVIDER_IDS = [
  "soleaspay",
  "ashtech",
  "sendavapay",
  "clapay",
] as const;

export type DepositOperatorProviderId = typeof DEPOSIT_OPERATOR_PROVIDER_IDS[number];
export type DepositOperatorsByCountry = Record<
  string,
  Partial<Record<DepositOperatorProviderId, string[]>>
>;

const PROVIDER_ID_SET = new Set<string>(DEPOSIT_OPERATOR_PROVIDER_IDS);

export function parseDepositOperatorsByCountry(
  raw: string | undefined,
): DepositOperatorsByCountry | undefined {
  if (!raw?.trim()) return undefined;

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error("La configuration des opérateurs par pays est invalide");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("La configuration des opérateurs par pays doit être un objet JSON");
  }

  const result: DepositOperatorsByCountry = {};
  for (const [rawCountry, rawProviders] of Object.entries(value)) {
    const country = normalizeCountryCode(rawCountry);
    if (!country || !rawProviders || typeof rawProviders !== "object" || Array.isArray(rawProviders)) {
      throw new Error(`Configuration des opérateurs invalide pour le pays ${rawCountry}`);
    }

    const providers: Partial<Record<DepositOperatorProviderId, string[]>> = {};
    for (const [rawProvider, rawIds] of Object.entries(rawProviders)) {
      const provider = rawProvider.trim().toLowerCase();
      if (!PROVIDER_ID_SET.has(provider)) {
        throw new Error(`Fournisseur d’opérateurs inconnu : ${rawProvider}`);
      }
      if (!Array.isArray(rawIds) || rawIds.length > 100) {
        throw new Error(`Liste d’opérateurs invalide pour ${provider} au ${country}`);
      }

      const ids = rawIds.map((rawId) => {
        if (typeof rawId !== "string" || !rawId.trim() || rawId.trim().length > 120) {
          throw new Error(`Identifiant d’opérateur invalide pour ${provider} au ${country}`);
        }
        return rawId.trim();
      });
      providers[provider as DepositOperatorProviderId] = ids.filter(
        (id, index) => ids.indexOf(id) === index,
      );
    }
    result[country] = providers;
  }
  return result;
}

export function isDepositOperatorSelected(
  config: DepositOperatorsByCountry | undefined,
  country: string,
  provider: DepositOperatorProviderId,
  operatorId: string,
  defaultSelected = true,
): boolean {
  const selectedIds = config?.[country.trim().toUpperCase()]?.[provider];
  return selectedIds === undefined ? defaultSelected : selectedIds.includes(operatorId);
}
