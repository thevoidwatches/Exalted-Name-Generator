import type { Category, Tier } from '@/types';

/** 'tier' picks a tier by fixed shares, then a word; 'word' weights each word by its tier multiplier. */
export type RarityMode = 'tier' | 'word';

export interface WeightConfig {
  patterns: Record<string, number>;
  categories: Partial<Record<Category, number>>;
  wordMult: Record<Tier, number>;
  tierShares: Record<Tier, number>;
}

/** The sets of weights that can be reset independently in the Weights panel. */
export type WeightSection = 'patterns' | 'modifiers' | 'nouns' | 'rarity';
