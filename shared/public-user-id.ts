const FIRST_PUBLIC_USER_ID = 8952;

export function formatPublicUserId(internalUserId: number): string {
  if (!Number.isSafeInteger(internalUserId) || internalUserId < 1) {
    throw new RangeError("L’identifiant interne doit être un entier positif.");
  }

  return String(FIRST_PUBLIC_USER_ID + internalUserId - 1);
}
