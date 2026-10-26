import { optionKey } from '@/functions';
import { TIERS } from '@/types';
import type { CategoryInfo, Pattern, Tier, WeightConfig, WeightSection } from '@/types';

/** The built-in weights: each pattern's, category's and optional part's default, plus the rarity settings. */
export function defaultWeights(patterns: readonly Pattern[], categories: readonly CategoryInfo[]): WeightConfig {
  return {
    patterns: Object.fromEntries(patterns.map((p) => [p.id, p.weight])),
    categories: Object.fromEntries(
      categories.filter((c) => c.weight !== undefined).map((c) => [c.id, c.weight as number]),
    ),
    wordMult: { common: 2, normal: 1, rare: 0.5 },
    tierShares: { common: 50, normal: 33, rare: 17 },
    options: Object.fromEntries(patterns.flatMap((p) => (p.options ?? []).map((o) => [optionKey(p.id, o.id), o.chance]))),
    style: { hyphenate: 5 },
  };
}

const isWeight = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

/**
 * Merges stored weights over the defaults, keeping only known keys with valid numbers.
 * Patterns, categories or optional parts added since the weights were saved get their default.
 */
export function sanitizeWeights(raw: unknown, defaults: WeightConfig): WeightConfig {
  const saved = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof WeightConfig, unknown>>;
  const merge = <T extends Record<string, number>>(group: keyof WeightConfig, fallback: T, max = Infinity): T => {
    const source = (saved[group] && typeof saved[group] === 'object' ? saved[group] : {}) as Record<string, unknown>;
    const out = { ...fallback };
    for (const key of Object.keys(fallback)) {
      const value = source[key];
      if (isWeight(value)) (out as Record<string, number>)[key] = Math.min(max, value);
    }
    return out;
  };
  return {
    patterns: merge('patterns', defaults.patterns),
    categories: merge('categories', defaults.categories as Record<string, number>),
    wordMult: merge('wordMult', defaults.wordMult),
    tierShares: merge('tierShares', defaults.tierShares),
    options: merge('options', defaults.options, 100),
    style: merge('style', defaults.style, 100),
  };
}

/** Restores one section of the Weights panel to its defaults, leaving the others alone. */
export function resetWeightSection(
  current: WeightConfig,
  defaults: WeightConfig,
  section: WeightSection,
  categories: readonly CategoryInfo[],
): WeightConfig {
  switch (section) {
    case 'patterns':
      return { ...current, patterns: { ...defaults.patterns } };
    // The hyphenation style sits in the Optional parts section, so it resets with the parts.
    case 'options':
      return { ...current, options: { ...defaults.options }, style: { ...defaults.style } };
    case 'rarity':
      return { ...current, wordMult: { ...defaults.wordMult }, tierShares: { ...defaults.tierShares } };
    case 'modifiers':
    case 'nouns':
    case 'others': {
      const group = section === 'modifiers' ? 'modifier' : section === 'nouns' ? 'noun' : 'other';
      const restored = { ...current.categories };
      for (const c of categories) {
        if (c.group === group && defaults.categories[c.id] !== undefined) restored[c.id] = defaults.categories[c.id];
      }
      return { ...current, categories: restored };
    }
  }
}

/**
 * The top of a weight chart's scale: half again the largest value, rounded up to the step,
 * and never less than ten steps, so there is always room to drag a bar higher.
 */
export function chartScale(values: readonly number[], step: number): number {
  const biggest = Math.max(0, ...values);
  return Math.max(Math.ceil((biggest * 1.5) / step) * step, step * 10);
}

/** Whole-number percentages of a total, for chart labels. */
export function percentOf(value: number, total: number): number {
  return total > 0 ? Math.round((100 * value) / total) : 0;
}

export const TIER_LABELS: Record<Tier, string> = { common: 'Common', normal: 'Normal', rare: 'Rare' };
export const TIER_ORDER: readonly Tier[] = TIERS;
