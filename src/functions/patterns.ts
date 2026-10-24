import type { Part, Pattern } from '@/types';

/*
 * Name patterns, in chip order. `weight` is the default draw weight, adjustable in the Weights panel.
 * Optional parts are listed in `options` and written {id} in the label, which the chip shows as [Label].
 * Each `build` draws its words through the helpers, which respect the chips, the slot rules and the
 * rarity settings, and asks `has` which optional parts this name includes.
 */
export const PATTERNS: Pattern[] = [
  {
    id: 'ordinalModNoun',
    label: '{ordinal} {modifier} Noun',
    example: 'Third Silken Blade',
    weight: 31,
    needs: ['noun'],
    tip: 'A noun with an ordinal, a modifier or both before it: Seventh Crane, Harmonious Jade, Third Silken Blade. With both, the modifier sometimes comes first: Sinister Third Star. After a modifier, a material may stand as the noun: Weeping Iron.',
    options: [
      {
        id: 'ordinal', label: 'Ordinal', chance: 60, needs: ['ordinal'],
        tip: 'An ordinal number before the noun: Seventh Crane.',
      },
      {
        id: 'modifier', label: 'Modifier', chance: 65, needs: ['modifier'],
        tip: 'A modifier (adjective, color, material or gerund) before the noun: Harmonious Jade.',
      },
    ],
    rules: [{ kind: 'atLeastOne', options: ['ordinal', 'modifier'] }],
    build: (h, has) => {
      // A bare ordinal takes the ordinal slot, which allows epithets (Seventh Wrath).
      if (!has('modifier')) return [h.ordinal(), h.noun('ordinal')];
      const modifier = h.modifier();
      const noun = h.noun('head', { orMaterial: modifier.kind !== 'material' });
      if (!has('ordinal')) return [modifier, noun];
      return h.chance(0.2) ? [modifier, h.ordinal(), noun] : [h.ordinal(), modifier, noun];
    },
  },
  {
    id: 'nounEnding',
    label: '{number} {modifier} Noun {ending}',
    example: 'Two Dogs Pursuing',
    weight: 18,
    needs: ['noun'],
    tip: 'A noun with a number before it (which makes it plural), a gerund or adjective after it, or both: Seven Ravens, Swan Ascendant, Two Dogs Pursuing. A modifier may come before the noun: Crimson Serpent Arriving.',
    options: [
      {
        id: 'number', label: 'Number', chance: 35, needs: ['cardinal'],
        tip: 'A counting number before the noun, which makes it plural: Seven Ravens.',
      },
      {
        id: 'modifier', label: 'Modifier', chance: 10, needs: ['modifier'],
        tip: 'A modifier just before the noun: Crimson Serpent Arriving, Seven Silver Ravens.',
      },
      {
        id: 'ending', label: 'Gerund/Adjective', chance: 80, needs: ['adjectiveOrGerund'],
        tip: 'A gerund or adjective after the noun: Serpent Arriving, Swan Ascendant.',
      },
    ],
    rules: [{ kind: 'atLeastOne', options: ['number', 'ending'] }],
    build: (h, has) => {
      const parts: Part[] = [];
      if (has('number')) parts.push(h.cardinal());
      if (has('modifier')) parts.push(h.modifier());
      // A bare count takes the number slot, which allows epithets (Three Bargains); with an ending, any head noun.
      parts.push(h.noun(has('number') && !has('ending') ? 'number' : 'head', { plural: has('number') }));
      if (has('ending')) parts.push(h.modifier(['color', 'material']));
      return parts;
    },
  },
  {
    id: 'nounOf',
    label: 'Noun of Modifier Noun',
    example: 'Lotus of Weeping Iron',
    weight: 5,
    needs: ['modifier', 'noun'],
    tip: 'A noun (sometimes plural), then "of", then a modifier and a noun or material: Lotus of Weeping Iron.',
    build: (h) => {
      const modifier = h.modifier();
      return [
        h.chance(0.4) ? h.noun('head', { plural: true }) : h.noun(),
        h.literal('of'),
        modifier,
        h.noun('head', { orMaterial: modifier.kind !== 'material' }),
      ];
    },
  },
  {
    id: 'modNounOf',
    label: '{lead} Noun of {the} Noun',
    example: 'Gold Star of Morn',
    weight: 5,
    needs: ['noun', 'nature'],
    tip: 'An optional modifier or ordinal, a noun, then "of" or "of the", and a nature word, an epithet, or a plural noun: Gold Star of Morn, Weeping Blade of the Storm, Hand of the Sea.',
    options: [
      {
        id: 'lead', label: 'Modifier', name: 'Opening modifier', chance: 70, needs: ['ordinalOrModifier'],
        tip: 'A modifier or ordinal before the first noun: Gold Star of Morn, Third Hand of the Sea.',
      },
      {
        id: 'the', label: 'the', name: '"the"', chance: 50,
        tip: '"of the" instead of "of", before a nature word only: Weeping Blade of the Storm.',
      },
    ],
    build: (h, has) => {
      const parts: Part[] = [];
      const lead = has('lead') ? h.leadIn(0.4) : null;
      if (lead) parts.push(lead);
      parts.push(h.noun());
      const r = h.roll();
      if (r < 0.3 && h.hasSlot('target')) {
        const target = h.noun('target');
        // Concepts read well plural after "of" half the time (Thief of Secrets); epithets stay singular.
        parts.push(h.literal('of'), target.kind === 'concept' && h.chance(0.5) ? h.pluralize(target) : target);
      } else if (r < 0.65) {
        parts.push(h.literal(has('the') ? 'of the' : 'of'), h.word('nature'));
      } else {
        parts.push(h.literal('of'), h.noun('head', { only: ['nature', 'animal', 'person', 'plant'], plural: true }));
      }
      return parts;
    },
  },
  {
    id: 'possessive',
    label: "{lead} Noun's Noun",
    example: "Winter's Fang",
    weight: 8,
    needs: ['noun'],
    tip: 'An owner with "\'s", then what is owned, usually a body part, object, person or concept. A modifier may lead: Cold Winter\'s Fang.',
    options: [
      {
        id: 'lead', label: 'Modifier', chance: 30, needs: ['modifier'],
        tip: "A modifier before the owner: Cold Winter's Fang.",
      },
    ],
    build: (h, has) => {
      const owner = h.noun();
      const parts = [{ ...owner, text: owner.text + "'s" }, h.noun('head', { only: ['body part', 'object', 'person', 'concept'] })];
      if (has('lead')) parts.unshift(h.modifier());
      return parts;
    },
  },
  {
    id: 'prep',
    label: 'Noun Preposition {the} Noun',
    example: 'Heron Beyond Twilight',
    weight: 6,
    needs: ['noun', 'nature'],
    tip: 'A noun, a preposition such as Beneath, Against or of, and a nature word (sometimes with "the"), epithet or plural noun: Heron Beyond Twilight, Wolf Beneath the Storm.',
    options: [
      {
        id: 'the', label: 'the', name: '"the"', chance: 50,
        tip: '"the" after the preposition, before a nature word only: Wolf Beneath the Storm.',
      },
    ],
    build: (h, has) => {
      const parts = [h.noun(), h.preposition()];
      const r = h.roll();
      if (r < 0.25 && h.hasSlot('target')) parts.push(h.noun('target'));
      else if (r < 0.75) parts.push(...(has('the') ? [h.literal('the')] : []), h.word('nature'));
      else parts.push(h.noun('head', { only: ['nature', 'animal', 'plant', 'object'], plural: true }));
      return parts;
    },
  },
  {
    id: 'titleOf',
    label: '{lead} Title of {tailNumber/tailModifier} Noun',
    example: 'Dancer of Thirteen Crowns',
    weight: 4,
    needs: ['title', 'noun'],
    tip: 'An optional modifier or ordinal, a title (a person or epithet), then "of", an optional number or modifier, and a noun, usually plural.',
    options: [
      {
        id: 'lead', label: 'Modifier', name: 'Opening modifier', chance: 55, needs: ['ordinalOrModifier'],
        tip: 'A modifier or ordinal before the title: Seventh Daughter of Storms.',
      },
      {
        id: 'tailNumber', label: 'Number', name: 'Number after "of"', chance: 25, needs: ['cardinal'],
        tip: 'A counting number before the last noun: Dancer of Thirteen Crowns.',
      },
      {
        id: 'tailModifier', label: 'Modifier', name: 'Modifier after "of"', chance: 35, needs: ['modifier'],
        tip: 'A modifier other than a gerund before the last noun: Dancer of Scarlet Crowns.',
      },
    ],
    rules: [{ kind: 'atMostOne', options: ['tailNumber', 'tailModifier'] }],
    build: (h, has) => {
      const parts: Part[] = [];
      const lead = has('lead') ? h.leadIn(0.35) : null;
      if (lead) parts.push(lead);
      parts.push(h.noun('title'), h.literal('of'));
      if (has('tailNumber')) parts.push(h.cardinal());
      else if (has('tailModifier') && h.anyModifier(['gerund'])) parts.push(h.modifier(['gerund']));
      parts.push(h.tailNoun(has('tailNumber')));
      return parts;
    },
  },
  {
    id: 'nounPair',
    label: '{modifier} Noun{hyphen}Noun',
    example: 'Crimson Wolf-Fang',
    weight: 19,
    needs: ['noun'],
    tip: 'Two nouns side by side, hyphenated half the time, sometimes with a modifier in front: Wolf-Fang, Storm Crane, Crimson Lotus Blade.',
    options: [
      {
        id: 'modifier', label: 'Modifier', chance: 35, needs: ['modifier'],
        tip: 'A modifier before the pair: Crimson Lotus Blade.',
      },
      {
        id: 'hyphen', label: '-', name: 'Hyphen', chance: 50, offText: ' ',
        tip: 'A hyphen between the nouns instead of a space: Wolf-Fang rather than Wolf Fang.',
      },
    ],
    build: (h, has) => {
      const second = h.noun('compound');
      const parts = [h.noun('compound'), has('hyphen') ? { ...second, joinBefore: '-' } : second];
      if (has('modifier')) parts.unshift(h.modifier());
      return parts;
    },
  },
  {
    id: 'modModNoun',
    label: 'Adjective/Gerund Color/Material Noun',
    example: 'Rusted Iron Dove',
    weight: 6,
    needs: ['adjectiveOrGerund', 'colorOrMaterial', 'noun'],
    tip: 'An adjective or gerund, then a color or material, then one noun: Rusted Iron Dove, Weeping Crimson Lotus.',
    build: (h) => [h.modifier(['color', 'material']), h.modifier(['adjective', 'gerund']), h.noun()],
  },
  {
    id: 'nobleName',
    label: 'Surname Forename',
    example: 'Cathak Alon Mursa',
    weight: 9,
    needs: [],
    tip: 'A noble of the Realm: the name of a Great or Minor House, then a personal name. Cathak Alon Mursa, Ferem Kea.',
    build: (h) => [h.word('house'), h.word('personal name')],
  },
];
