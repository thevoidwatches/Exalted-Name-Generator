/** Rarity tiers, in display order. A runtime list because the CSV parser validates against it. */
export const TIERS = ['common', 'normal', 'rare'] as const;
export type Tier = (typeof TIERS)[number];

export type ModifierCategory = 'adjective' | 'color' | 'material' | 'gerund';
export type NumberCategory = 'cardinal' | 'ordinal';
export type NounCategory =
  | 'animal'
  | 'plant'
  | 'nature'
  | 'object'
  | 'body part'
  | 'person'
  | 'concept'
  | 'epithet';
export type NameCategory = 'house' | 'personal name';
export type Category = ModifierCategory | NumberCategory | NounCategory | NameCategory | 'preposition';

/** Which CSV a category lives in, and which chip row it appears in. */
export type CategoryGroup = 'modifier' | 'number' | 'noun' | 'name' | 'preposition';

/** One row of a word CSV. A null plural means the word is never used in a plural slot. */
export interface WordEntry {
  word: string;
  plural: string | null;
  category: Category;
  tier: Tier;
}

export type WordIndex = Record<Category, WordEntry[]>;

/**
 * Positions a noun can fill inside a pattern.
 *   head     - any ordinary noun position
 *   compound - hyphenated names and the middle of a stacked Modifier Noun Noun
 *   ordinal  - directly after an ordinal (Seventh X)
 *   number   - pluralised after a cardinal (Three Xs)
 *   target   - the word after "of" (Daughter of X)
 *   title    - the title in Title of Noun (X of Scarlet Horses)
 */
export type Slot = 'head' | 'compound' | 'ordinal' | 'number' | 'target' | 'title';

export interface CategoryInfo {
  id: Category;
  group: CategoryGroup;
  /** Chip and chart label, e.g. "Body parts". */
  label: string;
  /** Tooltip on the chip. */
  tip: string;
  /** Default draw weight among its group. Only modifier and noun categories are weighted. */
  weight?: number;
  /** Noun slots this category may fill. Nouns without an explicit list use the default slots. */
  slots?: Slot[];
}
