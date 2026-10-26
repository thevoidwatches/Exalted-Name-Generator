import type { Category, Tier } from '@/types';

/** 'tier' picks a tier by fixed shares, then a word; 'word' weights each word by its tier multiplier. */
export type RarityMode = 'tier' | 'word';

export interface WeightConfig {
  patterns: Record<string, number>;
  categories: Partial<Record<Category, number>>;
  wordMult: Record<Tier, number>;
  tierShares: Record<Tier, number>;
  /** Each optional part's chance as a percentage, keyed "patternId.optionId". */
  options: Record<string, number>;
  /** Styles that apply across patterns, as percentages. `hyphenate` joins every word of a name with hyphens. */
  style: Record<'hyphenate', number>;
}

/** The sets of weights that can be reset independently in the Weights panel. */
export type WeightSection = 'patterns' | 'options' | 'style' | 'modifiers' | 'nouns' | 'others' | 'rarity';
