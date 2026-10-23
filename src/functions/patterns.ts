import { chance } from '@/functions';
import type { Need, Part, Pattern } from '@/types';

/*
 * Name patterns, in chip order. `weight` is the default draw weight, adjustable in the Weights panel.
 * Labels use [brackets] for optional parts. Each `build` draws its words through the helpers, which
 * respect the chips, the slot rules and the rarity settings.
 */
export const PATTERNS: Pattern[] = [
  {
    id: 'modNoun',
    label: 'Modifier Noun',
    example: 'Harmonious Jade',
    weight: 12,
    needs: ['modifier', 'noun'],
    tip: 'One modifier (adjective, color, material or gerund) followed by one noun.',
    build: (h) => [h.modifier(), h.noun()],
  },
  {
    id: 'ordNoun',
    label: 'Ordinal Noun',
    example: 'Seventh Crane',
    weight: 11,
    needs: ['ordinal', 'noun'],
    tip: 'An ordinal number followed by one noun.',
    build: (h) => [h.ordinal(), h.noun('ordinal')],
  },
  {
    id: 'ordModNoun',
    label: 'Ordinal Modifier Noun',
    example: 'Third Silken Blade',
    weight: 8,
    needs: ['ordinal', 'modifier', 'noun'],
    tip: 'An ordinal, a modifier and a noun. Usually in that order, sometimes modifier first: Sinister Third Star.',
    build: (h) => (h.chance(0.2) ? [h.modifier(), h.ordinal(), h.noun()] : [h.ordinal(), h.modifier(), h.noun()]),
  },
  {
    id: 'nounGerund',
    label: '[Number] Noun [Gerund]',
    example: 'Two Dogs Pursuing',
    weight: 10,
    needs: ['noun', 'gerundOrCardinal'],
    tip: 'A noun with an optional number before it (which makes it plural) and an optional gerund after it, at least one of the two: Seven Ravens, Serpent Arriving, Two Dogs Pursuing. Without a number, a modifier may lead: Crimson Serpent Arriving.',
    build: (h) => {
      const counting = h.isOn('cardinal');
      const acting = h.isOn('gerund');
      const r = h.roll();
      if (counting && (!acting || r < 0.35)) return [h.cardinal(), h.noun('number', { plural: true })];
      if (counting && r < 0.65) return [h.cardinal(), h.noun('head', { plural: true }), h.gerund()];
      const parts = [h.noun(), h.gerund()];
      if (h.chance(0.4) && h.anyModifier()) parts.unshift(h.modifier());
      return parts;
    },
  },
  {
    id: 'nounOf',
    label: 'Noun of Modifier Noun',
    example: 'Lotus of Weeping Iron',
    weight: 5,
    needs: ['modifier', 'noun'],
    tip: 'A noun (sometimes plural), then "of", then a modifier and a noun.',
    build: (h) => [
      h.chance(0.4) ? h.noun('head', { plural: true }) : h.noun(),
      h.literal('of'),
      h.modifier(),
      h.noun(),
    ],
  },
  {
    id: 'modNounOf',
    label: '[Modifier] Noun of [the] Noun',
    example: 'Gold Star of Morn',
    weight: 5,
    needs: ['noun', 'nature'],
    tip: 'An optional modifier or ordinal, a noun, then "of" or "of the", and a nature word, an epithet, or a plural noun: Gold Star of Morn, Weeping Blade of the Storm, Hand of the Sea.',
    build: (h) => {
      const parts: Part[] = [];
      if (h.chance(0.7)) {
        const lead = h.leadIn(0.4);
        if (lead) parts.push(lead);
      }
      parts.push(h.noun());
      const r = h.roll();
      if (r < 0.3 && h.hasSlot('target')) {
        const target = h.noun('target');
        // Concepts read well plural after "of" half the time (Thief of Secrets); epithets stay singular.
        parts.push(h.literal('of'), target.kind === 'concept' && h.chance(0.5) ? h.pluralize(target) : target);
      } else if (r < 0.65) {
        parts.push(h.literal(h.chance(0.5) ? 'of the' : 'of'), h.word('nature'));
      } else {
        parts.push(h.literal('of'), h.noun('head', { only: ['nature', 'animal', 'person', 'plant'], plural: true }));
      }
      return parts;
    },
  },
  {
    id: 'possessive',
    label: "[Modifier] Noun's Noun",
    example: "Winter's Fang",
    weight: 8,
    needs: ['noun'],
    tip: 'An owner with "\'s", then what is owned, usually a body part, object, person or concept. A modifier may lead: Cold Winter\'s Fang.',
    build: (h) => {
      const owner = h.noun();
      const parts = [{ ...owner, text: owner.text + "'s" }, h.noun('head', { only: ['body part', 'object', 'person', 'concept'] })];
      if (h.chance(0.3) && h.anyModifier()) parts.unshift(h.modifier());
      return parts;
    },
  },
  {
    id: 'prep',
    label: 'Noun Preposition Noun',
    example: 'Heron Beyond Twilight',
    weight: 6,
    needs: ['noun', 'nature'],
    tip: 'A noun, a preposition such as Beneath, Against or of, and a nature word, epithet or plural noun.',
    build: (h) => {
      const r = h.roll();
      const far =
        r < 0.25 && h.hasSlot('target')
          ? h.noun('target')
          : r < 0.75
            ? h.word('nature')
            : h.noun('head', { only: ['nature', 'animal', 'plant', 'object'], plural: true });
      return [h.noun(), h.preposition(), far];
    },
  },
  {
    id: 'titleOf',
    label: '[Modifier] Title of [Modifier] Noun',
    example: 'Dancer of Thirteen Crowns',
    weight: 4,
    needs: ['title', 'noun'],
    tip: 'An optional modifier or ordinal, a title (a person or epithet), then "of", an optional modifier or number, and a noun, usually plural.',
    build: (h) => {
      const parts: Part[] = [];
      if (h.chance(0.55)) {
        const lead = h.leadIn(0.35);
        if (lead) parts.push(lead);
      }
      parts.push(h.noun('title'), h.literal('of'));
      const r = h.roll();
      const afterNumber = r < 0.25 && h.isOn('cardinal');
      if (afterNumber) parts.push(h.cardinal());
      else if (r < 0.6 && h.anyModifier(['gerund'])) parts.push(h.modifier(['gerund']));
      parts.push(h.tailNoun(afterNumber));
      return parts;
    },
  },
  {
    id: 'modNounNoun',
    label: 'Modifier Noun Noun',
    example: 'Crimson Lotus Blade',
    weight: 7,
    needs: ['modifier', 'noun'],
    tip: 'A modifier followed by two nouns stacked together.',
    build: (h) => [h.modifier(), h.noun('compound'), h.noun()],
  },
  {
    id: 'hyphen',
    label: 'Noun[-]Noun',
    example: 'Wolf-Fang',
    weight: 12,
    needs: ['noun'],
    tip: 'Two nouns side by side, hyphenated half the time: Wolf-Fang, Storm Crane.',
    joiner: () => (chance(0.5) ? '-' : ' '),
    build: (h) => [h.noun('compound'), h.noun('compound')],
  },
  {
    id: 'nounAdj',
    label: 'Noun Adjective',
    example: 'Swan Ascendant',
    weight: 8,
    needs: ['adjective', 'noun'],
    tip: 'A noun followed by an adjective, in poetic inversion.',
    build: (h) => [h.noun(), h.adjective()],
  },
];

/** How each need is described when a pattern chip is unavailable. */
export const NEED_LABELS: Record<Need, string> = {
  modifier: 'a modifier source',
  noun: 'a noun source',
  adjective: 'Adjectives',
  nature: 'Nature',
  title: 'People or Epithets',
  ordinal: 'Ordinals',
  gerundOrCardinal: 'Gerunds or Cardinals',
};
