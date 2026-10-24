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
  /** What goes between this part and the one before it. Defaults to a space; "-" joins a hyphenated pair. */
  joinBefore?: string;
}

/** Conditions a pattern, or an optional part of one, needs before it can be used. */
export type Need =
  | 'modifier'
  | 'noun'
  | 'adjective'
  | 'nature'
  | 'title'
  | 'ordinal'
  | 'cardinal'
  | 'ordinalOrModifier'
  | 'adjectiveOrGerund'
  | 'colorOrMaterial';

export interface NounOptions {
  /** Prefer these categories when any of them is on and allowed in the slot. */
  only?: Category[];
  /** Draw only words that have a plural, and use the plural. */
  plural?: boolean;
  /** Let a material stand in for the noun now and then, as in Harmonious Jade. Never for a plural. */
  orMaterial?: boolean;
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

/** An optional part of a pattern, switched on and off from its chip's menu, with a chance in the Weights panel. */
export interface PatternOption {
  /** Unique within its pattern. Stored settings use the key "patternId.optionId". */
  id: string;
  /** The text shown in brackets in the chip label, e.g. "Number". */
  label: string;
  /** The name in the chip's menu and the Weights panel, when the label alone would be ambiguous. */
  name?: string;
  tip: string;
  /** Default chance, as a percentage, that a name includes the part. */
  chance: number;
  /** Sources the part needs. Without them it is left out. */
  needs?: Need[];
  /** What the label shows when the part is left out, for a part that replaces text rather than adding it. */
  offText?: string;
}

/**
 * How a pair of optional parts combine. Both share one roll, so their chances stay exact where they can.
 *   atLeastOne - every name has one or both. Chances adding up to under 100% are scaled up to 100%.
 *   atMostOne  - no name has both. Chances adding up to over 100% are scaled down to 100%.
 */
export interface OptionRule {
  kind: 'atLeastOne' | 'atMostOne';
  options: [string, string];
}

/** Tells a pattern whether the name being built includes one of its optional parts. */
export type HasOption = (option: string) => boolean;

export interface Pattern {
  id: string;
  /** Chip label. Optional parts are written {id}, or {a/b} for two that share one position; see patternLabel. */
  label: string;
  example: string;
  tip: string;
  weight: number;
  needs: Need[];
  options?: PatternOption[];
  rules?: OptionRule[];
  build(helpers: Helpers, has: HasOption): Part[];
}

export interface GeneratedName {
  text: string;
  /** The categories that made the name, e.g. "ordinal · color · animal". */
  form: string;
  patternId: string;
  parts: Part[];
}
