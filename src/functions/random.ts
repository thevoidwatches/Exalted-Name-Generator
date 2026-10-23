/** A whole number from 0 up to, but not including, n. */
export function randomInt(n: number): number {
  return Math.floor(Math.random() * n);
}

/** True with the given probability, from 0 to 1. */
export function chance(probability: number): boolean {
  return Math.random() < probability;
}

export function pickOne<T>(items: readonly T[]): T {
  return items[randomInt(items.length)];
}

/**
 * Picks one item, each with probability proportional to its weight.
 * If every weight is zero, the last item is returned so callers never get undefined.
 */
export function pickWeighted<T>(entries: ReadonlyArray<readonly [T, number]>): T {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  for (const [item, weight] of entries) {
    roll -= weight;
    if (roll < 0) return item;
  }
  return entries[entries.length - 1][0];
}
