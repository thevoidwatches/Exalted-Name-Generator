import type { CategoryGroup, CategoryInfo } from '@/types';

/** The groups shown as rows of source chips. Names and prepositions are drawn only by their own patterns. */
export const CHIP_GROUPS: readonly CategoryGroup[] = ['modifier', 'number', 'noun', 'other'];

/*
 * Every word category, in chip order. Edit labels, tooltips and default weights here.
 * The `slots` lists limit where a noun category may appear; nouns without one use the default slots
 * (head, compound, ordinal, number). See the Slot type in src/types/words.ts.
 */
export const CATEGORIES: CategoryInfo[] = [
  // Modifiers
  {
    id: 'adjective', group: 'modifier', label: 'Adjectives', weight: 30,
    tip: 'Describing words with a lofty or poetic tone, such as Harmonious, Resplendent, Wistful.',
  },
  {
    id: 'color', group: 'modifier', label: 'Colors', weight: 25,
    tip: 'Color words, from plain Red and White to Cerulean, Saffron and Viridian.',
  },
  {
    id: 'material', group: 'modifier', label: 'Materials', weight: 25,
    tip: 'Metals, gems, stones and fabrics used as descriptors, such as Jade, Bronze, Silk, Obsidian.',
  },
  {
    id: 'gerund', group: 'modifier', label: 'Gerunds', weight: 20,
    tip: 'Action words ending in -ing, such as Weeping, Thundering, Warding.',
  },

  // Numbers
  {
    id: 'ordinal', group: 'number', label: 'Ordinals',
    tip: 'Position numbers such as First, Seventh, Hundredth, Last. Required by the Ordinal patterns and an optional lead-in in others. Tiered like every other list, so the long and silly ones stay rare.',
  },
  {
    id: 'cardinal', group: 'number', label: 'Cardinals',
    tip: 'Counting numbers such as Two, Seven, Thousand, Dozen. Fill the [Number] slot in any pattern that shows one. Tiered like every other list, so the long and silly ones stay rare.',
  },

  // Nouns
  {
    id: 'animal', group: 'noun', label: 'Animals', weight: 18,
    tip: 'Beasts, birds, fish and insects, including a few from Creation such as Raiton and Strix.',
  },
  {
    id: 'plant', group: 'noun', label: 'Plants', weight: 18,
    tip: 'Trees, flowers, herbs and fungi, such as Lotus, Cedar, Thistle, Plum.',
  },
  {
    id: 'nature', group: 'noun', label: 'Nature', weight: 18,
    tip: 'Weather, seasons, skies, landscapes and times of day, such as Storm, Winter, Star, Dusk, Heaven.',
  },
  {
    id: 'object', group: 'noun', label: 'Objects', weight: 16,
    tip: 'Made things: weapons, tools, instruments and regalia, such as Blade, Lantern, Crown, Scroll.',
  },
  {
    id: 'body part', group: 'noun', label: 'Body parts', weight: 14,
    tip: 'Parts of a body, human or beast, such as Hand, Fang, Wing, Heart, Shadow.',
  },
  {
    id: 'person', group: 'noun', label: 'People', weight: 14,
    slots: ['head', 'compound', 'ordinal', 'number', 'title'],
    tip: 'Roles, titles and kin, such as Daughter, Dancer, Hunter, Widow, Sentinel.',
  },
  {
    id: 'concept', group: 'noun', label: 'Concepts', weight: 8,
    slots: ['head', 'compound', 'ordinal', 'number', 'target'],
    tip: 'Abstract nouns that act like objects: oaths, songs, visions and paths, such as Prayer, Verdict, Mandate, Way. Used everywhere except as the title in Title of Noun.',
  },
  {
    id: 'epithet', group: 'noun', label: 'Epithets', weight: 6,
    slots: ['ordinal', 'number', 'target', 'title'],
    tip: 'Virtues, vices and deeds, such as Wrath, Insight, Theft. Used only after an ordinal, a number, or "of", or as the title in Title of Noun: Seventh Wrath, Three Bargains, Daughter of Insight, Dance of Laurels.',
  },
  {
    id: 'place', group: 'noun', label: 'Places', weight: 10,
    tip: 'Places people build or gather in, such as Temple, Market, Crypt, District, Garden. After "of" or a preposition they take "the" like nature words: Heron Beneath the Bridge.',
  },

  // Verbs and adverbs, for the few patterns that use them.
  {
    id: 'verb', group: 'other', label: 'Verbs', weight: 15,
    tip: 'Things a noun does, such as Thunders, Sleeps, Howls. They can end [Number] [Modifier] Noun names, agreeing with the noun: Serpent Sleeps, Twelve Dogs Thunder.',
  },
  {
    id: 'adverb', group: 'other', label: 'Adverbs', weight: 20,
    tip: 'Words that sharpen an adjective, such as Eternally, Utterly, Softly. Used only in Adverb/Adjective Adjective/Gerund Noun: Eternally Mourning Virgin.',
  },

  // Noble names for Surname Forename; not shown as chips.
  {
    id: 'house', group: 'name', label: 'Houses',
    tip: 'The Great and Minor Houses of the Realm, such as Cathak, Ledaal, V’neef, Ferem. All drawn equally.',
  },
  {
    id: 'personal name', group: 'name', label: 'Personal names',
    tip: 'Given names for the nobility, some of them two words long, such as Kea, Alon Mursa, Belar Demi.',
  },

  // Joining words for Noun Preposition Noun; not shown as a chip.
  {
    id: 'preposition', group: 'preposition', label: 'Prepositions',
    tip: 'Joining words such as Beneath, Against and of.',
  },
];
