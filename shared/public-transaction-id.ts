export type PublicTransactionKind = "D" | "R" | "T";

function hash32(value: string, seed: number): number {
  let hash = seed >>> 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 0x01000193) >>> 0;
  }
  return hash;
}

/**
 * Stable, readable public ID based on the row's immutable database ID.
 * The final base-36 segment preserves uniqueness within each record type;
 * the leading kind distinguishes deposits, withdrawals, and wallet entries.
 */
export function formatPublicTransactionId(kind: PublicTransactionKind, id: number): string {
  if (!Number.isSafeInteger(id) || id < 0) {
    throw new RangeError("Identifiant de transaction invalide.");
  }

  const key = `${kind}:${id}`;
  const first = hash32(key, 0x811c9dc5).toString(36).toUpperCase().padStart(7, "0");
  const second = hash32(`${id}:${kind}`, 0x9e3779b9).toString(36).toUpperCase().padStart(7, "0");
  const fingerprint = `${first}${second}`.slice(0, 10);
  const rowKey = id.toString(36).toUpperCase().padStart(6, "0");

  return `${kind}${fingerprint}${rowKey}`;
}
