import bcrypt from "bcrypt";

const ADMIN_PIN_HASH_PATTERN = /^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$/;
const MIN_ADMIN_PIN_LENGTH = 4;
const MAX_ADMIN_PIN_LENGTH = 64;

export function isHashedAdminPin(value: string): boolean {
  return ADMIN_PIN_HASH_PATTERN.test(value);
}

export async function hashAdminPin(pin: string): Promise<string> {
  if (typeof pin !== "string" || pin.length < MIN_ADMIN_PIN_LENGTH || pin.length > MAX_ADMIN_PIN_LENGTH) {
    throw new Error("Le code PIN doit contenir entre 4 et 64 caractères.");
  }
  return bcrypt.hash(pin, 12);
}

export async function verifyAdminPin(
  providedPin: string,
  storedPin: string,
): Promise<{ valid: boolean; needsRehash: boolean }> {
  if (
    typeof providedPin !== "string"
    || providedPin.length < MIN_ADMIN_PIN_LENGTH
    || providedPin.length > MAX_ADMIN_PIN_LENGTH
  ) {
    return { valid: false, needsRehash: false };
  }

  if (isHashedAdminPin(storedPin)) {
    return {
      valid: await bcrypt.compare(providedPin, storedPin),
      needsRehash: false,
    };
  }

  const valid = storedPin === providedPin;
  return { valid, needsRehash: valid };
}
