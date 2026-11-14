export type ManualDepositPhoneRule = {
  prefix: string;
  nationalDigits: number;
  countryName: string;
};

export const MANUAL_DEPOSIT_PHONE_RULES: Record<string, ManualDepositPhoneRule> = {
  CI: { prefix: "225", nationalDigits: 10, countryName: "Côte d’Ivoire" },
  TG: { prefix: "228", nationalDigits: 8, countryName: "Togo" },
  BF: { prefix: "226", nationalDigits: 8, countryName: "Burkina Faso" },
  NE: { prefix: "227", nationalDigits: 8, countryName: "Niger" },
  BJ: { prefix: "229", nationalDigits: 10, countryName: "Bénin" },
};

export function getManualDepositPhoneRule(countryCode: string): ManualDepositPhoneRule | undefined {
  return MANUAL_DEPOSIT_PHONE_RULES[countryCode.trim().toUpperCase()];
}

export function isValidManualDepositPayerPhone(
  countryCode: string,
  countryPrefix: string,
  value: string,
): boolean {
  const digits = value.replace(/\D/g, "");
  const rule = getManualDepositPhoneRule(countryCode);
  const prefix = (rule?.prefix || countryPrefix).replace(/\D/g, "");

  if (prefix && !digits.startsWith(prefix)) return false;
  const nationalNumber = prefix ? digits.slice(prefix.length) : digits;

  if (rule) return nationalNumber.length === rule.nationalDigits;
  return nationalNumber.length >= 5 && nationalNumber.length <= 15;
}
