import { pickOne, pickWeighted } from '@/functions';
import { TIERS } from '@/types';
import type { RarityMode, Tier, WeightConfig, WordEntry } from '@/types';

/**
 * Draws one word from a list according to the rarity mode.
 *   tier: pick a tier by its share (only tiers the list actually has), then any word in it.
 *   word: every word weighs its tier's multiplier, so a big tier gets more draws in total.
 */
export function pickEntry(entries: readonly WordEntry[], mode: RarityMode, weights: WeightConfig): WordEntry {
  if (mode === 'tier') {
    const groups = TIERS.map((tier) => [entries.filter((e) => e.tier === tier), weights.tierShares[tier]] as const)
      .filter(([group]) => group.length > 0);
    return pickOne(pickWeighted(groups));
  }
  return pickWeighted(entries.map((e) => [e, weights.wordMult[e.tier]] as const));
}

/** In per-word mode, the share of a list's draws that lands in each tier, as fractions summing to 1. */
export function tierMass(entries: readonly WordEntry[], wordMult: Record<Tier, number>): Record<Tier, number> {
  const mass: Record<Tier, number> = { common: 0, normal: 0, rare: 0 };
  for (const e of entries) mass[e.tier] += wordMult[e.tier];
  const total = mass.common + mass.normal + mass.rare;
  if (total <= 0) return mass;
  return { common: mass.common / total, normal: mass.normal / total, rare: mass.rare / total };
}
