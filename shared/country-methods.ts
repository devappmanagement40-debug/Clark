export interface CountryMethodEntry {
  name: string;
  isActive: boolean;
}

export function normalizeCountryCode(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const code = value.trim().toUpperCase();
  return /^[A-Z]{2,3}$/.test(code) ? code : undefined;
}

export function parseCountryMethodEntries(
  value: string | null | undefined,
): CountryMethodEntry[] {
  if (!value) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const entries: CountryMethodEntry[] = [];
  const seen = new Set<string>();
  for (const item of parsed) {
    const name = typeof item === "string"
      ? item.trim()
      : item && typeof item === "object" && "name" in item && typeof item.name === "string"
        ? item.name.trim()
        : "";
    if (!name) continue;

    const key = name.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const isActive = item && typeof item === "object" && "isActive" in item
      ? item.isActive !== false
      : true;
    entries.push({ name, isActive });
  }
  return entries;
}

export function getActiveCountryMethodNames(
  value: string | null | undefined,
): string[] {
  return parseCountryMethodEntries(value)
    .filter((entry) => entry.isActive)
    .map((entry) => entry.name);
}

export function hasConfiguredCountryMethods(
  value: string | null | undefined,
): boolean {
  return parseCountryMethodEntries(value).length > 0;
}
