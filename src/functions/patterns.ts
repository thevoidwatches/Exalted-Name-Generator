import type { Category, HasOption, Helpers, Part, Pattern } from '@/types';

/** Body parts that come in pairs or sets, which [Ordinal] [Modifier] Noun may make plural: Brilliant Eyes. */
export const PAIRED_BODY_PARTS: readonly string[] = [
  'Ankle', 'Antler', 'Bone', 'Brow', 'Cheek', 'Claw', 'Ear', 'Elbow', 'Eye', 'Fang', 'Feather', 'Fin', 'Finger',
  'Fist', 'Foot', 'Hand', 'Heel', 'Hip', 'Hoof', 'Horn', 'Knee', 'Knuckle', 'Leg', 'Limb', 'Palm', 'Paw', 'Rib',
  'Scale', 'Shoulder', 'Spine', 'Spur', 'Talon', 'Thumb', 'Toe', 'Tooth', 'Tusk', 'Whisker', 'Wing', 'Wrist',
];

const isPlural = (part: Part) => !!part.entry?.plural && part.text === part.entry.plural && part.text !== part.entry.word;

/** How the end of an "of" or preposition name is drawn when there's no modifier before its last noun. */
interface EndRules {
  /** Chance of a concept or epithet (Thief of Secrets). */
  target: number;
  /** Chance of a nature word or place (Hand of the Sea); otherwise a plural noun from `plurals`. */
  nature: number;
  plurals: Category[];
  /** Whether a material may end the name. Only after "of": Storm of Amber. */
  materials: boolean;
  /** Chance the last noun is plural when a modifier comes before it. */
  pluralAfterModifier: number;
}

const OF_END: EndRules = {
  target: 0.3, nature: 0.35, plurals: ['nature', 'animal', 'person', 'plant'], materials: true, pluralAfterModifier: 0.35,
};
const PREPOSITION_END: EndRules = {
  target: 0.25, nature: 0.5, plurals: ['nature', 'animal', 'plant', 'object', 'place'], materials: false, pluralAfterModifier: 0.5,
};

/**
 * The end of an "of" or preposition name, after the joining word: [the] [Modifier] Noun [and Noun].
 * "the" only goes before a nature word, a place, or a modifier and noun, never a material or a bare plural.
 */
function nameEnd(h: Helpers, has: HasOption, rules: EndRules): Part[] {
  const parts: Part[] = [];
  let end: Part;
  let takesThe: boolean;
  if (has('tailModifier')) {
    const modifier = h.modifier();
    end = h.chance(rules.pluralAfterModifier)
      ? h.noun('head', { plural: true })
      : h.noun('head', { orMaterial: rules.materials && modifier.kind !== 'material' });
    parts.push(modifier, end);
    takesThe = true;
  } else {
    const r = h.roll();
    if (r < rules.target && h.hasSlot('target')) {
      const target = h.noun('target');
      // Concepts read well plural half the time (Thief of Secrets); epithets stay singular.
      end = target.kind === 'concept' && h.chance(0.5) ? h.pluralize(target) : target;
      takesThe = false;
    } else if (r < rules.target + rules.nature) {
      end = h.noun('head', { only: ['nature', 'place'], orMaterial: rules.materials });
      takesThe = end.kind !== 'material';
    } else {
      end = h.noun('head', { only: rules.plurals, plural: true });
      takesThe = false;
    }
    parts.push(end);
  }
  if (has('the') && takesThe) parts.unshift(h.literal('the'));
  if (has('and')) {
    // The second noun matches the first: plural after a plural, otherwise an abstract or a nature word.
    const second = isPlural(end)
      ? h.noun('head', { plural: true })
      : h.hasSlot('target') && h.chance(0.5)
        ? h.noun('target')
        : h.noun('head', { only: ['nature', 'place'], orMaterial: rules.materials });
    parts.push(h.literal('and'), second);
  }
  return parts;
}

/*
 * Name patterns, in chip order. `weight` is the default draw weight, adjustable in the Weights panel.
 * Optional parts are listed in `options` and written {id} in the label, which the chip shows as [Label].
 * Each `build` draws its words through the helpers, which respect the chips, the slot rules and the
 * rarity settings, and asks `has` which optional parts this name includes.
 */
export const PATTERNS: Pattern[] = [
  {
    id: 'ordinalModNoun',
    label: '{the} {ordinal} {modifier} Noun{plural}',
    example: 'Third Silken Blade',
    weight: 31,
    needs: ['noun'],
    tip: 'A noun with an ordinal, a modifier or both before it, sometimes led by "The": Seventh Crane, Harmonious Jade, The Bloody Mouse. With both, the modifier sometimes comes first: Sinister Third Star. After a modifier, a material may stand as the noun (Weeping Iron), and a body part that comes in pairs may be plural (Brilliant Eyes).',
    options: [
      {
        id: 'the', label: 'The', name: '"The"', chance: 30,
        tip: '"The" in front: The Bloody Mouse, The Seventh Crane.',
      },
      {
        id: 'ordinal', label: 'Ordinal', chance: 60, needs: ['ordinal'],
        tip: 'An ordinal number before the noun: Seventh Crane.',
      },
      {
        id: 'modifier', label: 'Modifier', chance: 65, needs: ['modifier'],
        tip: 'A modifier (adjective, color, material or gerund) before the noun: Harmonious Jade.',
      },
      {
        id: 'plural', label: 's', name: 'Plural body part', chance: 50, needs: ['modifier'],
        tip: 'With a modifier and no ordinal, a body part that comes in pairs or sets is made plural: Brilliant Eyes, Swift Feet.',
      },
    ],
    rules: [{ kind: 'atLeastOne', options: ['ordinal', 'modifier'] }],
    build: (h, has) => {
      const the = has('the') ? [h.literal('The')] : [];
      // A bare ordinal takes the ordinal slot, which allows epithets (Seventh Wrath).
      if (!has('modifier')) return [...the, h.ordinal(), h.noun('ordinal')];
      const modifier = h.modifier();
      let noun = h.noun('head', { orMaterial: modifier.kind !== 'material' });
      if (!has('ordinal')) {
        if (has('plural') && noun.kind === 'body part' && PAIRED_BODY_PARTS.includes(noun.text)) noun = h.pluralize(noun);
        return [...the, modifier, noun];
      }
      return [...the, ...(h.chance(0.2) ? [modifier, h.ordinal(), noun] : [h.ordinal(), modifier, noun])];
    },
  },
  {
    id: 'nounEnding',
    label: '{number} {modifier} Noun {ending}',
    example: 'Two Dogs Pursuing',
    weight: 18,
    needs: ['noun'],
    tip: 'A noun with a number before it (which makes it plural), a gerund, adjective or verb after it, or both: Seven Ravens, Swan Ascendant, Two Dogs Pursuing, Twelve Dogs Thunder. A modifier may come before the noun: Crimson Serpent Arriving.',
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
        id: 'ending', label: 'Gerund/Adjective/Verb', chance: 80, needs: ['adjectiveGerundOrVerb'],
        tip: 'A gerund, adjective or verb after the noun: Serpent Arriving, Swan Ascendant, Serpent Sleeps.',
      },
    ],
    rules: [{ kind: 'atLeastOne', options: ['number', 'ending'] }],
    build: (h, has) => {
      const parts: Part[] = [];
      if (has('number')) parts.push(h.cardinal());
      if (has('modifier')) parts.push(h.modifier());
      // A bare count takes the number slot, which allows epithets (Three Bargains); with an ending, any head noun.
      parts.push(h.noun(has('number') && !has('ending') ? 'number' : 'head', { plural: has('number') }));
      if (has('ending')) {
        const end = h.pick(['adjective', 'gerund', 'verb']);
        // A verb agrees with its noun: Serpent Sleeps, Twelve Dogs Thunder.
        parts.push(end.kind === 'verb' && has('number') ? h.pluralize(end) : end);
      }
      return parts;
    },
  },
  {
    id: 'nounOfNoun',
    label: '{lead} Noun of {the} {tailModifier} Noun {and}',
    example: 'Lotus of Weeping Iron',
    weight: 10,
    needs: ['noun'],
    tip: 'A noun (sometimes plural), "of", and a nature word, place, material, concept, epithet or plural noun, with optional modifiers on either side: Gold Star of Morn, Lotus of Weeping Iron, Right Hand of Ordained Rule, Sage of the Lilac Garden.',
    options: [
      {
        id: 'lead', label: 'Modifier', name: 'Opening modifier', chance: 35, needs: ['ordinalOrModifier'],
        tip: 'A modifier or ordinal before the first noun: Gold Star of Morn, Right Hand of Ordained Rule.',
      },
      {
        id: 'the', label: 'the', name: '"the"', chance: 50,
        tip: '"of the" instead of "of", before a nature word, a place, or a modifier and noun: Hand of the Sea, Sage of the Lilac Garden.',
      },
      {
        id: 'tailModifier', label: 'Modifier', name: 'Modifier after "of"', chance: 50, needs: ['modifier'],
        tip: 'A modifier before the last noun, which may then be plural or a material: Lotus of Weeping Iron, Breath of Frozen Tears.',
      },
      {
        id: 'and', label: 'and Noun', name: '"and" a second noun', chance: 15,
        tip: 'A second noun joined with "and": Sweet Voice of Brass and Glory.',
      },
    ],
    build: (h, has) => {
      const parts: Part[] = [];
      const lead = has('lead') ? h.leadIn(0.4) : null;
      if (lead) parts.push(lead);
      parts.push(h.chance(0.2) ? h.noun('head', { plural: true }) : h.noun(), h.literal('of'));
      return [...parts, ...nameEnd(h, has, OF_END)];
    },
  },
  {
    id: 'possessive',
    label: "{lead} Noun's {ownedModifier} Noun",
    example: "Winter's Fang",
    weight: 8,
    needs: ['noun'],
    tip: 'An owner with "\'s", then what is owned, usually a body part, object, person or concept. Either may have a modifier: Cold Winter\'s Fang, Songbird\'s Eternal Dive.',
    options: [
      {
        id: 'lead', label: 'Modifier', name: 'Opening modifier', chance: 30, needs: ['modifier'],
        tip: "A modifier before the owner: Cold Winter's Fang.",
      },
      {
        id: 'ownedModifier', label: 'Modifier', name: 'Modifier before the second noun', chance: 25, needs: ['modifier'],
        tip: "A modifier before what is owned: Songbird's Eternal Dive.",
      },
    ],
    build: (h, has) => {
      const owner = h.noun();
      // A plural-only word such as Lips takes a bare apostrophe: Lips' Song.
      const mark = owner.entry?.plural === owner.entry?.word && owner.text.endsWith('s') ? "'" : "'s";
      const parts: Part[] = [{ ...owner, text: owner.text + mark }];
      if (has('ownedModifier')) parts.push(h.modifier());
      parts.push(h.noun('head', { only: ['body part', 'object', 'person', 'concept'] }));
      if (has('lead')) parts.unshift(h.modifier());
      return parts;
    },
  },
  {
    id: 'prep',
    label: '{lead} {noun} Preposition {the} {tailModifier} Noun {and}',
    example: 'Heron Beyond Twilight',
    weight: 6,
    needs: ['noun'],
    tip: 'A noun, a preposition such as Beneath, With or in, and a nature word, place, epithet or plural noun, with optional modifiers on either side: Heron Beyond Twilight, Graceful Willow in Calm Winds. Without the first noun, an adjective or gerund leads alone: Austere in Calamity.',
    options: [
      {
        id: 'lead', label: 'Modifier', name: 'Opening modifier', chance: 30, needs: ['modifier'],
        tip: 'A modifier before the first noun: Hungry Maid in Chains.',
      },
      {
        id: 'noun', label: 'Noun', name: 'First noun', chance: 90,
        tip: 'The noun the name starts with. Without it, an adjective or gerund leads alone: Austere in Calamity.',
      },
      {
        id: 'the', label: 'the', name: '"the"', chance: 50,
        tip: '"the" after the preposition, before a nature word, a place, or a modifier and noun: Wolf Beneath the Storm.',
      },
      {
        id: 'tailModifier', label: 'Modifier', name: 'Modifier after the preposition', chance: 30, needs: ['modifier'],
        tip: 'A modifier before the last noun, which may then be plural: Pale Bonfire Upon Broken Petals, Savior From Cruel Joy.',
      },
      {
        id: 'and', label: 'and Noun', name: '"and" a second noun', chance: 15,
        tip: 'A second noun joined with "and": King in Hate and Despair.',
      },
    ],
    rules: [{ kind: 'atLeastOne', options: ['lead', 'noun'] }],
    build: (h, has) => {
      const parts: Part[] = [];
      // Leading alone, the modifier must be an adjective or gerund: Austere in Calamity, not Crimson in Calamity.
      if (has('lead')) parts.push(has('noun') ? h.modifier() : h.modifier(['color', 'material']));
      if (has('noun')) parts.push(h.chance(0.2) ? h.noun('head', { plural: true }) : h.noun());
      parts.push(h.preposition());
      return [...parts, ...nameEnd(h, has, PREPOSITION_END)];
    },
  },
  {
    id: 'prepTheNounOf',
    label: 'Preposition the Noun of Noun',
    example: 'Beneath the Hush of Winter',
    weight: 4,
    needs: ['noun'],
    tip: 'A preposition, "the", a noun, then "of" and a nature word, place or plural noun: Beneath the Hush of Winter, Under the Eye of Heaven.',
    build: (h) => {
      const preposition = h.preposition(['of']);
      const tail = h.chance(0.6)
        ? h.noun('head', { only: ['nature', 'place'] })
        : h.noun('head', { only: ['nature', 'animal', 'person', 'plant'], plural: true });
      return [
        // Lowercase prepositions such as "in" still open the name with a capital.
        { ...preposition, text: preposition.text[0].toUpperCase() + preposition.text.slice(1) },
        h.literal('the'),
        h.noun(),
        h.literal('of'),
        tail,
      ];
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
    id: 'doubleModNoun',
    label: 'Adverb/Adjective Adjective/Gerund Noun',
    example: 'Eternally Mourning Virgin',
    weight: 4,
    needs: ['adverbOrAdjective', 'adjectiveOrGerund', 'noun'],
    tip: 'An adverb or adjective, then an adjective or gerund, then a noun. Often a little goofy: Eternally Mourning Virgin, Lovely Silken Dancer, Unfailingly Righteous Brotherhood.',
    build: (h) => [h.pick(['adverb', 'adjective']), h.pick(['adjective', 'gerund']), h.noun()],
  },
  {
    id: 'nobleName',
    label: 'Surname Forename',
    example: 'Cathak Alon Mursa',
    weight: 9,
    needs: [],
    noHyphenStyle: true,
    tip: 'A noble of the Realm: the name of a Great or Minor House, then a personal name. Cathak Alon Mursa, Ferem Kea.',
    build: (h) => [h.word('house'), h.word('personal name')],
  },
];
