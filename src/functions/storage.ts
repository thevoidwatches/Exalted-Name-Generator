/** Browser storage keys. Kept names and weights live only in this browser. */
export const STORAGE_KEYS = {
  keptNames: 'exalted:kept-names',
  weights: 'exalted:weights',
  rarityMode: 'exalted:rarity-mode',
} as const;

/** Reads and parses a stored value. Any failure, including blocked storage, gives the fallback. */
export function readStored<T>(key: string, fallback: T, sanitize?: (raw: unknown) => T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return sanitize ? sanitize(parsed) : (parsed as T);
  } catch {
    return fallback;
  }
}

/** Stores a value, or removes it when given undefined. Failures are ignored; the page works without storage. */
export function writeStored(key: string, value: unknown): void {
  try {
    if (value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be full or blocked in a private window; the in-memory state still works.
  }
}
