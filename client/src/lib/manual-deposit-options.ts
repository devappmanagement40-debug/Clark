import type { PaymentNumber } from "@shared/schema";

export type ManualDepositOperatorChoice = {
  id: string;
  name: string;
  manualNumber?: PaymentNumber;
};

export function canonicalManualOperatorName(country: string, name: string): string {
  const normalized = name.toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
  if (country === "TG") {
    if (normalized.includes("tmoney") || normalized.includes("togocel") || normalized.includes("yastogo")) return "Togocel";
    if (normalized.includes("moov")) return "Moov Africa Togo";
  }
  if (country === "BJ") {
    if (normalized.includes("mtn")) return "MTN Bénin";
    if (normalized.includes("moov")) return "Moov Africa Bénin";
  }
  return name.trim();
}

export function getManualDepositOperatorChoices(
  country: string,
  configuredOperatorNames: string[],
  paymentNumbers: PaymentNumber[],
): ManualDepositOperatorChoice[] {
  const normalizedCountry = country.trim().toUpperCase();
  const configuredNames = Array.from(new Set(
    configuredOperatorNames
      .map((name) => canonicalManualOperatorName(normalizedCountry, name))
      .filter(Boolean),
  ));

  if (configuredNames.length === 0) {
    return paymentNumbers.map((manualNumber) => ({
      id: `manual-${manualNumber.id}`,
      name: manualNumber.operatorName,
      manualNumber,
    }));
  }

  return configuredNames.flatMap((name) => {
    const configuredNumbers = paymentNumbers.filter(
      (number) => canonicalManualOperatorName(normalizedCountry, number.operatorName) === name,
    );
    return configuredNumbers.length
      ? configuredNumbers.map((manualNumber) => ({
          id: `manual-${manualNumber.id}`,
          name,
          manualNumber,
        }))
      : [{ id: `${normalizedCountry.toLocaleLowerCase()}-unconfigured-${name}`, name }];
  });
}
