import { chance, pickEntry, pickWeighted } from '@/functions';
import type {
  Category,
  CategoryGroup,
  CategoryInfo,
  GeneratorContext,
  Helpers,
  NounOptions,
  Part,
  Slot,
  WordEntry,
} from '@/types';

export const DEFAULT_NOUN_SLOTS: Slot[] = ['head', 'compound', 'ordinal', 'number'];

/** The slots a category may fill. Only noun categories have slots. */
export function slotsOf(category: CategoryInfo): Slot[] {
  if (category.group !== 'noun') return [];
  return category.slots ?? DEFAULT_NOUN_SLOTS;
}

export function categoriesIn(ctx: GeneratorContext, group: CategoryGroup): CategoryInfo[] {
  return ctx.categories.filter((c) => c.group === group);
}

/** Noun categories that are on and allowed in the slot. */
export function nounsForSlot(ctx: GeneratorContext, slot: Slot): CategoryInfo[] {
  return categoriesIn(ctx, 'noun').filter((c) => ctx.enabled[c.id] && slotsOf(c).includes(slot));
}

// After "of" in Title of Noun: these are always plural, these half the time, and materials stay singular.
const TAIL_ALWAYS_PLURAL: Category[] = ['animal', 'body part', 'object', 'person'];
const TAIL_SOMETIMES_PLURAL: Category[] = ['nature', 'plant'];
const TAIL_MATERIAL_WEIGHT = 14;

/** Builds the word-drawing toolkit that patterns use, bound to one page state. */
export function createHelpers(ctx: GeneratorContext): Helpers {
  const isOn = (id: string) => !!ctx.enabled[id];
  const weightOf = (c: CategoryInfo) => ctx.weights.categories[c.id] ?? c.weight ?? 0;
  const canPlural = (category: Category) => ctx.words[category].some((e) => e.plural);

  const toPart = (entry: WordEntry, slot?: Slot): Part => ({
    text: entry.word,
    base: entry.word,
    kind: entry.category,
    slot,
    entry,
  });

  const pluralize = (part: Part): Part => (part.entry?.plural ? { ...part, text: part.entry.plural } : part);

  const word = (category: Category, options?: { plural?: boolean }): Part => {
    const all = ctx.words[category];
    const plural = !!options?.plural && canPlural(category);
    const pool = plural ? all.filter((e) => e.plural) : all;
    const part = toPart(pickEntry(pool, ctx.rarityMode, ctx.weights));
    return plural ? pluralize(part) : part;
  };

  const activeModifiers = (exclude?: Category[]) =>
    categoriesIn(ctx, 'modifier').filter((c) => isOn(c.id) && !exclude?.includes(c.id));

  const modifier = (exclude?: Category[]): Part => {
    let pool = activeModifiers(exclude);
    if (!pool.length) pool = activeModifiers();
    const category = pickWeighted(pool.map((c) => [c, weightOf(c)] as const));
    return word(category.id);
  };

  // Narrows the noun categories step by step, keeping the first non-empty choice:
  // the preferred categories in this slot, any category in this slot, any head noun, any noun at all.
  const nounPool = (slot: Slot, options?: NounOptions): CategoryInfo[] => {
    const usable = (list: CategoryInfo[]) => (options?.plural ? list.filter((c) => canPlural(c.id)) : list);
    const inSlot = usable(nounsForSlot(ctx, slot));
    const stages = [
      options?.only ? inSlot.filter((c) => options.only!.includes(c.id)) : [],
      inSlot,
      usable(nounsForSlot(ctx, 'head')),
      usable(categoriesIn(ctx, 'noun').filter((c) => isOn(c.id))),
    ];
    return stages.find((stage) => stage.length > 0) ?? [];
  };

  const noun = (slot: Slot = 'head', options?: NounOptions): Part => {
    let plural = !!options?.plural;
    let pool = nounPool(slot, options);
    if (!pool.length && plural) {
      plural = false;
      pool = nounPool(slot, { ...options, plural: false });
    }
    if (!pool.length) throw new Error('No noun source is turned on.');
    const category = pickWeighted(pool.map((c) => [c, weightOf(c)] as const));
    return { ...word(category.id, { plural }), slot };
  };

  const ordinal = () => word('ordinal');
  const cardinal = () => word('cardinal');

  return {
    roll: () => Math.random(),
    chance,
    isOn,
    hasSlot: (slot) => nounsForSlot(ctx, slot).length > 0,
    anyModifier: (exclude) => activeModifiers(exclude).length > 0,
    word,
    modifier,
    noun,
    ordinal,
    cardinal,
    gerund: () => word('gerund'),
    adjective: () => word('adjective'),
    // Prepositions join a name like "of" does, so they are literals: not shown in the form or de-duplicated.
    preposition: () => ({ text: word('preposition').text, base: null, kind: null }),
    literal: (text) => ({ text, base: null, kind: null }),
    pluralize,

    leadIn(ordinalChance) {
      const canOrdinal = isOn('ordinal');
      const canModifier = activeModifiers().length > 0;
      if (!canOrdinal && !canModifier) return null;
      return canOrdinal && (!canModifier || chance(ordinalChance)) ? ordinal() : modifier();
    },

    tailNoun(afterNumber) {
      const pool: Array<readonly [Category, number]> = categoriesIn(ctx, 'noun')
        .filter((c) => isOn(c.id) && [...TAIL_ALWAYS_PLURAL, ...TAIL_SOMETIMES_PLURAL].includes(c.id))
        .map((c) => [c.id, weightOf(c)] as const);
      const material = ctx.categories.find((c) => c.id === 'material');
      if (material && isOn('material') && weightOf(material) > 0 && !afterNumber) {
        pool.push(['material', TAIL_MATERIAL_WEIGHT]);
      }
      if (!pool.length) return noun('head', { plural: true });
      const category = pickWeighted(pool);
      const plural =
        afterNumber ||
        TAIL_ALWAYS_PLURAL.includes(category) ||
        (TAIL_SOMETIMES_PLURAL.includes(category) && chance(0.5));
      return word(category, { plural });
    },
  };
}
