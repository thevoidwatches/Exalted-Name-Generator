import type {
  Category,
  CategoryInfo,
  RarityMode,
  Slot,
  WeightConfig,
  WordEntry,
  WordIndex,
} from '@/types';

/** Everything a pattern needs to build a name. Built fresh from the page state for each batch. */
export interface GeneratorContext {
  words: WordIndex;
  categories: CategoryInfo[];
  enabled: Record<string, boolean>;
  weights: WeightConfig;
  rarityMode: RarityMode;
}

/** One piece of a name. Literal joining words such as "of" have no category. */
export interface Part {
  text: string;
  /** The singular word, used to stop a name repeating itself. Null for literals. */
  base: string | null;
  kind: Category | null;
  /** The noun slot this part was drawn for, when it is a noun. */
  slot?: Slot;
  entry?: WordEntry;
}

/** Conditions a pattern needs before it can run. */
export type Need = 'modifier' | 'noun' | 'adjective' | 'nature' | 'title' | 'ordinal' | 'gerundOrCardinal';

export interface NounOptions {
  /** Prefer these categories when any of them is on and allowed in the slot. */
  only?: Category[];
  /** Draw only words that have a plural, and use the plural. */
  plural?: boolean;
}

/** The word-drawing toolkit handed to each pattern. */
export interface Helpers {
  /** A random number from 0 to 1, for choosing between several branches. */
  roll(): number;
  chance(probability: number): boolean;
  isOn(id: string): boolean;
  hasSlot(slot: Slot): boolean;
  anyModifier(exclude?: Category[]): boolean;
  word(category: Category, options?: { plural?: boolean }): Part;
  modifier(exclude?: Category[]): Part;
  noun(slot?: Slot, options?: NounOptions): Part;
  ordinal(): Part;
  cardinal(): Part;
  gerund(): Part;
  adjective(): Part;
  preposition(): Part;
  literal(text: string): Part;
  /** An optional lead-in: an ordinal with the given chance, otherwise a modifier. Null if neither is on. */
  leadIn(ordinalChance: number): Part | null;
  /** The noun after "of" in Title of Noun. */
  tailNoun(afterNumber: boolean): Part;
  /** Turns a drawn noun into its plural, if it has one. */
  pluralize(part: Part): Part;
}

export interface Pattern {
  id: string;
  /** Chip label; [brackets] mark optional parts. */
  label: string;
  example: string;
  tip: string;
  weight: number;
  needs: Need[];
  /** Separator between parts. Defaults to a space. */
  joiner?: () => string;
  build(helpers: Helpers): Part[];
}

export interface GeneratedName {
  text: string;
  /** The categories that made the name, e.g. "ordinal · color · animal". */
  form: string;
  patternId: string;
  parts: Part[];
}
