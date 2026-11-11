type TogocelUssdInput = {
  countryCode: string;
  operatorName: string;
  amount: number;
  recipientPhone?: string | null;
  paymentLink?: string | null;
  countryPhonePrefix?: string | null;
};

export function buildTogocelManualUssdCode({
  countryCode,
  operatorName,
  amount,
  recipientPhone,
  paymentLink,
  countryPhonePrefix,
}: TogocelUssdInput): string {
  const normalizedOperator = operatorName.toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
  const isTogocel = normalizedOperator.includes("togocel")
    || normalizedOperator.includes("tmoney")
    || normalizedOperator.includes("yastogo");
  const amountInteger = Math.trunc(amount);
  if (
    countryCode.trim().toUpperCase() !== "TG"
    || !isTogocel
    || paymentLink
    || !recipientPhone
    || !Number.isSafeInteger(amountInteger)
    || amountInteger <= 0
  ) {
    return "";
  }

  const phoneDigits = recipientPhone.replace(/\D/g, "");
  const prefixDigits = (countryPhonePrefix || "").replace(/\D/g, "");
  const merchantId = prefixDigits
    && phoneDigits.startsWith(prefixDigits)
    && phoneDigits.length > prefixDigits.length
    ? phoneDigits.slice(prefixDigits.length)
    : phoneDigits;

  return merchantId ? `*145*5*${amountInteger}*${merchantId}#` : "";
}
