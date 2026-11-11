export function getWithdrawalMethods(
  _countryCode: string,
  configuredMethods: readonly string[] = [],
): string[] {
  return Array.from(new Set(
    configuredMethods
      .map((method) => method.trim())
      .filter(Boolean),
  ));
}

export function isAllowedWithdrawalMethod(
  countryCode: string,
  paymentMethod: string,
  configuredMethods: readonly string[] = [],
): boolean {
  const method = paymentMethod.trim().toLocaleLowerCase();
  return getWithdrawalMethods(countryCode, configuredMethods)
    .some((allowedMethod) => allowedMethod.toLocaleLowerCase() === method);
}
