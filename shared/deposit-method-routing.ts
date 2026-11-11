import { normalizeCountryCode } from "./country-methods";

export const DEPOSIT_METHOD_IDS = [
  "manual",
  "soleaspay",
  "ashtech",
  "sendavapay",
  "westpay",
  "inpay",
  "clapay",
] as const;

export type DepositMethodId = typeof DEPOSIT_METHOD_IDS[number];

const DEPOSIT_METHOD_ID_SET = new Set<string>(DEPOSIT_METHOD_IDS);

export function parseDepositMethodsByCountry(
  raw: string | undefined,
): Record<string, DepositMethodId[]> | undefined {
  if (!raw?.trim()) return undefined;

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error("La configuration des méthodes de dépôt par pays est invalide");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("La configuration des méthodes de dépôt par pays doit être un objet JSON");
  }

  const result: Record<string, DepositMethodId[]> = {};
  for (const [rawCountry, rawMethods] of Object.entries(value)) {
    const country = normalizeCountryCode(rawCountry);
    if (!country || !Array.isArray(rawMethods)) {
      throw new Error(`Configuration de dépôt invalide pour le pays ${rawCountry}`);
    }
    const methods = rawMethods.map((method) => String(method).trim().toLowerCase());
    const invalidMethod = methods.find((method) => !DEPOSIT_METHOD_ID_SET.has(method));
    if (invalidMethod) {
      throw new Error(`Méthode de dépôt inconnue : ${invalidMethod}`);
    }
    result[country] = (methods as DepositMethodId[]).filter(
      (method, index, list) => list.indexOf(method) === index,
    );
  }
  return result;
}
