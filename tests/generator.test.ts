import { describe, expect, it } from 'vitest';
import { CATEGORIES, WORDS } from '@/data';
import {
  PAIRED_BODY_PARTS,
  PATTERNS,
  activePatterns,
  defaultWeights,
  generateBatch,
  makeName,
  missingNeeds,
  optionKeys,
  patternLabel,
  pickEntry,
  resetWeightSection,
  rollOptions,
  sanitizeWeights,
  slotsOf,
  tierMass,
  unavailableReason,
} from '@/functions';
import type { Category, GeneratedName, GeneratorContext, Pattern, RarityMode } from '@/types';

const DEFAULTS = defaultWeights(PATTERNS, CATEGORIES);
const ALL_IDS = [...PATTERNS.map((p) => p.id), ...optionKeys(PATTERNS), ...CATEGORIES.map((c) => c.id)];

function context(
  options: { off?: string[]; onlyPattern?: string; rarityMode?: RarityMode; chances?: Record<string, number> } = {},
): GeneratorContext {
  const off = new Set(options.off ?? []);
  if (options.onlyPattern) PATTERNS.forEach((p) => p.id !== options.onlyPattern && off.add(p.id));
  return {
    words: WORDS,
    categories: CATEGORIES,
    enabled: Object.fromEntries(ALL_IDS.map((id) => [id, !off.has(id)])),
    weights: { ...DEFAULTS, options: { ...DEFAULTS.options, ...options.chances } },
    rarityMode: options.rarityMode ?? 'tier',
  };
}

const patternById = (id: string): Pattern => PATTERNS.find((p) => p.id === id)!;

function names(ctx: GeneratorContext, count: number): GeneratedName[] {
  const out: GeneratedName[] = [];
  for (let i = 0; i < count; i++) {
    const name = makeName(ctx);
    if (name) out.push(name);
  }
  return out;
}

const categoryInfo = (id: Category) => CATEGORIES.find((c) => c.id === id)!;

describe('every pattern', () => {
  for (const pattern of PATTERNS) {
    describe(patternLabel(pattern), () => {
      const results = names(context({ onlyPattern: pattern.id }), 400);

      it('produces names', () => {
        expect(results.length).toBeGreaterThan(380);
      });

      it('only puts nouns in slots their category allows', () => {
        for (const { parts, text } of results) {
          for (const part of parts) {
            if (part.slot && part.kind) expect(slotsOf(categoryInfo(part.kind)), `${part.kind} in ${part.slot}: ${text}`).toContain(part.slot);
            if (part.kind === 'epithet') expect(part.slot, `epithet without a slot: ${text}`).toBeDefined();
          }
        }
      });

      it('only pluralises words that have a plural', () => {
        for (const { parts, text } of results) {
          for (const part of parts) {
            if (!part.base || [part.base, `${part.base}'s`, `${part.base}'`].includes(part.text)) continue;
            expect(part.entry?.plural, text).toBe(part.text);
          }
        }
      });

      it('never repeats a word within a name', () => {
        for (const { parts, text } of results) {
          const bases = parts.flatMap((p) => (p.base ? [p.base.toLowerCase()] : []));
          expect(new Set(bases).size, text).toBe(bases.length);
        }
      });
    });
  }
});

describe('source chips', () => {
  it('keep switched-off sources out of every name', () => {
    const off: Category[] = ['animal', 'gerund', 'ordinal', 'cardinal'];
    for (const name of names(context({ off }), 3000)) {
      for (const part of name.parts) expect(off, name.text).not.toContain(part.kind);
    }
  });

  it('leave [Ordinal] [Modifier] Noun making Modifier Noun names when Ordinals is off', () => {
    const results = names(context({ onlyPattern: 'ordinalModNoun', off: ['ordinal', 'ordinalModNoun.the'] }), 300);
    expect(results.length).toBeGreaterThan(280);
    expect(results.every((n) => n.parts.length === 2 && n.parts[0].kind !== 'ordinal')).toBe(true);
    const noLead = context({ off: ['ordinal', 'adjective', 'color', 'material', 'gerund'] });
    expect(unavailableReason(patternById('ordinalModNoun'), noLead)).toMatch(/Ordinal needs Ordinals/);
  });

  it('disable [Number] Noun [Gerund/Adjective/Verb] only when neither a number nor an ending can appear', () => {
    const pattern = patternById('nounEnding');
    expect(unavailableReason(pattern, context({ off: ['cardinal'] }))).toBeNull();
    expect(unavailableReason(pattern, context({ off: ['adjective', 'gerund', 'verb'] }))).toBeNull();
    expect(unavailableReason(pattern, context({ off: ['cardinal', 'adjective', 'gerund', 'verb'] }))).toMatch(/Number needs Cardinals/);
    expect(unavailableReason(pattern, context({ off: ['nounEnding.number', 'nounEnding.ending'] }))).toMatch(/switched off/);
    expect(activePatterns(context({ off: ['nounEnding.number', 'nounEnding.ending'] })).map((p) => p.id)).not.toContain('nounEnding');
  });

  it('make noble names from a house and a personal name, whatever the noun sources', () => {
    const nounsOff = CATEGORIES.filter((c) => c.group === 'noun').map((c) => c.id);
    const results = names(context({ onlyPattern: 'nobleName', off: nounsOff }), 200);
    expect(results.length).toBe(200);
    expect(results.every((n) => n.form === 'house · personal name')).toBe(true);
  });

  it('need People or Epithets for Title of Noun', () => {
    const pattern = PATTERNS.find((p) => p.id === 'titleOf')!;
    expect(missingNeeds(pattern, context({ off: ['person'] }))).toEqual([]);
    expect(missingNeeds(pattern, context({ off: ['person', 'epithet'] }))).toEqual(['title']);
  });
});

describe('weights', () => {
  it('never draw a pattern weighted zero', () => {
    const ctx = { ...context(), weights: { ...DEFAULTS, patterns: { ...DEFAULTS.patterns, ordinalModNoun: 0 } } };
    expect(activePatterns(ctx).map((p) => p.id)).not.toContain('ordinalModNoun');
    expect(generateBatch(200, ctx).every((n) => n.patternId !== 'ordinalModNoun')).toBe(true);
  });

  it('fall back to defaults for missing or invalid stored values', () => {
    const merged = sanitizeWeights({ patterns: { ordinalModNoun: 3, nounPair: -1, bogus: 9 }, wordMult: 'nonsense' }, DEFAULTS);
    expect(merged.patterns.ordinalModNoun).toBe(3);
    expect(merged.patterns.nounPair).toBe(DEFAULTS.patterns.nounPair);
    expect(merged.patterns).not.toHaveProperty('bogus');
    expect(merged.wordMult).toEqual(DEFAULTS.wordMult);
    expect(merged.options).toEqual(DEFAULTS.options);
    expect(sanitizeWeights(null, DEFAULTS)).toEqual(DEFAULTS);
  });

  it('cap stored optional-part chances at 100%', () => {
    const merged = sanitizeWeights({ options: { 'nounPair.hyphen': 250, 'possessive.lead': 40 } }, DEFAULTS);
    expect(merged.options['nounPair.hyphen']).toBe(100);
    expect(merged.options['possessive.lead']).toBe(40);
  });

  it('reset one section without touching the others', () => {
    const changed = {
      ...DEFAULTS,
      patterns: { ...DEFAULTS.patterns, ordinalModNoun: 1 },
      categories: { ...DEFAULTS.categories, adjective: 1, animal: 1 },
    };
    const reset = resetWeightSection(changed, DEFAULTS, 'modifiers', CATEGORIES);
    expect(reset.categories.adjective).toBe(DEFAULTS.categories.adjective);
    expect(reset.categories.animal).toBe(1);
    expect(reset.patterns.ordinalModNoun).toBe(1);
  });
});

describe('optional parts', () => {
  const rollShares = (pattern: Pattern, ctx: GeneratorContext, [a, b]: [string, string], draws = 20000) => {
    const counts = { onlyA: 0, onlyB: 0, both: 0, neither: 0 };
    for (let i = 0; i < draws; i++) {
      const chosen = rollOptions(pattern, ctx);
      if (chosen.has(a) && chosen.has(b)) counts.both++;
      else if (chosen.has(a)) counts.onlyA++;
      else if (chosen.has(b)) counts.onlyB++;
      else counts.neither++;
    }
    return { onlyA: counts.onlyA / draws, onlyB: counts.onlyB / draws, both: counts.both / draws, neither: counts.neither / draws };
  };

  it('each appear exactly once in their pattern label', () => {
    for (const pattern of PATTERNS) {
      const placed = [...pattern.label.matchAll(/\{([^}]+)\}/g)].flatMap((m) => m[1].split('/'));
      expect(placed.sort(), pattern.id).toEqual((pattern.options ?? []).map((o) => o.id).sort());
    }
  });

  it('show in brackets, and drop out of the label when they cannot appear', () => {
    expect(patternLabel(patternById('nounEnding'))).toBe('[Number] [Modifier] Noun [Gerund/Adjective/Verb]');
    expect(patternLabel(patternById('titleOf'))).toBe('[Modifier] Title of [Number/Modifier] Noun');
    expect(patternLabel(patternById('titleOf'), (id) => id !== 'tailNumber')).toBe('[Modifier] Title of [Modifier] Noun');
    expect(patternLabel(patternById('ordinalModNoun'))).toBe('[The] [Ordinal] [Modifier] Noun[s]');
    expect(patternLabel(patternById('nounPair'))).toBe('[Modifier] Noun[-]Noun');
    expect(patternLabel(patternById('nounPair'), () => false)).toBe('Noun Noun');
    expect(patternLabel(patternById('prep'))).toBe('[Modifier] [Noun] Preposition [the] [Modifier] Noun [and Noun]');
    expect(patternLabel(patternById('nounOfNoun'))).toBe('[Modifier] Noun of [the] [Modifier] Noun [and Noun]');
    expect(patternLabel(patternById('possessive'))).toBe("[Modifier] Noun's [Modifier] Noun");
    expect(patternLabel(patternById('prepTheNounOf'))).toBe('Preposition the Noun of Noun');
    expect(patternLabel(patternById('modModNoun'))).toBe('Adjective/Gerund Color/Material Noun');
  });

  it('never appear when switched off', () => {
    for (const pattern of PATTERNS) {
      for (const option of pattern.options ?? []) {
        const ctx = context({ off: [`${pattern.id}.${option.id}`] });
        for (let i = 0; i < 300; i++) expect(rollOptions(pattern, ctx).has(option.id), `${pattern.id}.${option.id}`).toBe(false);
      }
    }
  });

  it('always appear at 100%, unless a rule pairs them', () => {
    for (const pattern of PATTERNS) {
      const ruled = new Set((pattern.rules ?? []).flatMap((r) => r.options));
      for (const option of (pattern.options ?? []).filter((o) => !ruled.has(o.id))) {
        const ctx = context({ chances: { [`${pattern.id}.${option.id}`]: 100 } });
        for (let i = 0; i < 300; i++) expect(rollOptions(pattern, ctx).has(option.id), `${pattern.id}.${option.id}`).toBe(true);
      }
    }
  });

  it('shape the names they belong to', () => {
    expect(names(context({ onlyPattern: 'nounPair', off: ['nounPair.hyphen'] }), 300).some((n) => n.text.includes('-'))).toBe(false);
    const hyphenated = names(context({ onlyPattern: 'nounPair', chances: { 'nounPair.hyphen': 100, 'nounPair.modifier': 50 } }), 300);
    expect(hyphenated.every((n) => n.text.includes('-'))).toBe(true);
    // Only the two nouns are joined: a modifier in front stays a separate word.
    for (const { parts, text } of hyphenated.filter((n) => n.parts.length === 3)) {
      expect(text).toBe(`${parts[0].text} ${parts[1].text}-${parts[2].text}`);
    }
    expect(names(context({ onlyPattern: 'possessive', off: ['possessive.lead', 'possessive.ownedModifier'] }), 300).every((n) => n.parts.length === 2)).toBe(true);
    const counted = names(context({ onlyPattern: 'nounEnding', off: ['nounEnding.number'] }), 300);
    expect(counted.some((n) => n.parts.some((p) => p.kind === 'cardinal'))).toBe(false);
  });

  it('make only paired body parts plural, and only after a modifier with no ordinal', () => {
    const results = names(context({ onlyPattern: 'ordinalModNoun', chances: { 'ordinalModNoun.plural': 100 } }), 4000);
    const plurals = results.filter((n) => n.parts.some((p) => p.entry?.plural && p.text === p.entry.plural && p.text !== p.entry.word));
    expect(plurals.length).toBeGreaterThan(0);
    for (const { parts, text } of plurals) {
      const noun = parts[parts.length - 1];
      expect(noun.kind, text).toBe('body part');
      expect(PAIRED_BODY_PARTS, text).toContain(noun.base);
      expect(parts.some((p) => p.kind === 'ordinal'), text).toBe(false);
    }
  });

  it('never put "the" straight before a material after "of"', () => {
    const ctx = context({ onlyPattern: 'nounOfNoun', off: ['nounOfNoun.tailModifier', 'nounOfNoun.and'], chances: { 'nounOfNoun.the': 100 } });
    const endsInMaterial = names(ctx, 3000).filter((n) => n.parts[n.parts.length - 1].kind === 'material');
    expect(endsInMaterial.length).toBeGreaterThan(0);
    for (const n of endsInMaterial) expect(n.text).not.toContain(`the ${n.parts[n.parts.length - 1].text}`);
  });

  it('let a material stand as the last noun only after a modifier that is not itself a material', () => {
    for (const id of ['ordinalModNoun', 'nounOfNoun']) {
      const results = names(context({ onlyPattern: id }), 3000);
      const ending = (n: GeneratedName) => n.parts.slice(-2).map((p) => p.kind);
      expect(results.some((n) => ending(n)[1] === 'material'), id).toBe(true);
      for (const n of results) if (ending(n)[1] === 'material') expect(ending(n)[0], n.text).not.toBe('material');
    }
  });

  it('make a verb ending agree with its noun', () => {
    const off = ['adjective', 'gerund'];
    const counted = names(context({ onlyPattern: 'nounEnding', off, chances: { 'nounEnding.number': 100 } }), 300);
    const single = names(context({ onlyPattern: 'nounEnding', off: [...off, 'nounEnding.number'] }), 300);
    const verbOf = (n: GeneratedName) => n.parts[n.parts.length - 1];
    for (const n of counted.filter((n) => verbOf(n).kind === 'verb')) expect(verbOf(n).text, n.text).toBe(verbOf(n).entry!.plural);
    for (const n of single) expect(verbOf(n).text, n.text).toBe(verbOf(n).entry!.word);
    expect(single.every((n) => verbOf(n).kind === 'verb')).toBe(true);
  });

  it('open Noun Preposition Noun with an adjective or gerund when the first noun is left out', () => {
    for (const n of names(context({ onlyPattern: 'prep', off: ['prep.noun'] }), 500)) {
      expect(['adjective', 'gerund'], n.text).toContain(n.parts[0].kind);
    }
  });

  it('open Preposition the Noun of Noun with a capital, and never with "of"', () => {
    for (const n of names(context({ onlyPattern: 'prepTheNounOf' }), 500)) {
      expect(n.text, n.text).toMatch(/^[A-Z]/);
      expect(n.text.startsWith('Of '), n.text).toBe(false);
    }
  });

  it('give an at-least-one pair its chances, overlapping only as much as they must', () => {
    const pattern = patternById('nounEnding');
    const shares = rollShares(pattern, context(), ['number', 'ending']);
    expect(shares.neither).toBe(0);
    expect(shares.both).toBeCloseTo(0.15, 1);
    expect(shares.onlyA).toBeCloseTo(0.2, 1);
    expect(shares.onlyB).toBeCloseTo(0.65, 1);
  });

  it('scale an at-least-one pair up to 100% when its chances fall short', () => {
    const ctx = context({ chances: { 'nounEnding.number': 20, 'nounEnding.ending': 30 } });
    const shares = rollShares(patternById('nounEnding'), ctx, ['number', 'ending']);
    expect(shares.neither).toBe(0);
    expect(shares.both).toBe(0);
    expect(shares.onlyA).toBeCloseTo(0.4, 1);
  });

  it('never give both parts of an at-most-one pair, scaling them down when they overflow', () => {
    const pattern = patternById('titleOf');
    const shares = rollShares(pattern, context(), ['tailNumber', 'tailModifier']);
    expect(shares.both).toBe(0);
    expect(shares.onlyA).toBeCloseTo(0.25, 1);
    expect(shares.neither).toBeCloseTo(0.4, 1);
    const ctx = context({ chances: { 'titleOf.tailNumber': 75, 'titleOf.tailModifier': 75 } });
    const scaled = rollShares(pattern, ctx, ['tailNumber', 'tailModifier']);
    expect(scaled.both).toBe(0);
    expect(scaled.neither).toBe(0);
    expect(scaled.onlyA).toBeCloseTo(0.5, 1);
  });
});

describe('examples', () => {
  /*
   * Narrows every list that holds one of the example's words to just those words. Weighted sources without
   * one keep their words but weigh zero, so they are never drawn while a source that has one is on;
   * ordinals, cardinals and prepositions without one are switched off.
   */
  function exampleContext(example: string, patternId: string): GeneratorContext {
    // Match whole words or phrases, so two-word names such as Alon Mursa count too.
    const padded = ` ${example.replace(/-/g, ' ').replace(/'s\b/g, '')} `;
    const inExample = (text: string | null) => text !== null && padded.includes(` ${text} `);
    const matches = (category: Category) => WORDS[category].filter((e) => inExample(e.word) || inExample(e.plural));
    const words = Object.fromEntries(
      CATEGORIES.map((c) => [c.id, matches(c.id).length ? matches(c.id) : WORDS[c.id]]),
    ) as GeneratorContext['words'];
    const base = context({ onlyPattern: patternId });
    for (const c of CATEGORIES) if (c.weight === undefined && !matches(c.id).length) base.enabled[c.id] = false;
    const categories = Object.fromEntries(
      CATEGORIES.filter((c) => c.weight !== undefined).map((c) => [c.id, matches(c.id).length ? c.weight! : 0]),
    );
    return { ...base, words, weights: { ...base.weights, categories } };
  }

  const cases: Array<[string, string]> = [
    ...PATTERNS.map((p): [string, string] => [p.id, p.example]),
    // The page header's examples, and the inverted adjective from the tooltips.
    ['ordinalModNoun', 'Harmonious Jade'],
    ['ordinalModNoun', 'Seventh Crane'],
    ['nounOfNoun', 'Lotus of Weeping Iron'],
    ['nounEnding', 'Swan Ascendant'],
    // Plural body parts after a modifier.
    ['ordinalModNoun', 'Brilliant Eyes'],
    ['ordinalModNoun', 'Strong Hands'],
    ['ordinalModNoun', 'Swift Feet'],
    // A plural or material after "of", and a concept after a number in Title of Noun.
    ['nounOfNoun', 'Breath of Frozen Tears'],
    ['nounOfNoun', 'Rain of Killing Shadows'],
    ['nounOfNoun', 'Storm of Amber'],
    ['titleOf', 'Beast of Seven Lamentations'],
    // One of each newer shape from the extra names list.
    ['nounOfNoun', 'Right Hand of Ordained Rule'],
    ['nounOfNoun', 'Sage of the Lilac Garden'],
    ['prep', 'Pale Bonfire Upon Broken Petals'],
    ['prep', 'Austere in Calamity'],
    ['prep', 'King in Hate and Despair'],
    ['nounEnding', 'Twelve Dogs Thunder'],
    ['ordinalModNoun', 'The Bloody Mouse'],
    ['possessive', "Songbird's Eternal Dive"],
    ['prepTheNounOf', 'Beneath the Hush of Winter'],
    ['doubleModNoun', 'Unfailingly Righteous Brotherhood'],
    ['nounPair', 'Peaceable District Guardian'],
  ];

  for (const [patternId, example] of cases) {
    it(`can produce ${example}`, () => {
      const ctx = exampleContext(example, patternId);
      // Some examples need several optional parts at once, so keep drawing until one turns up.
      let found = false;
      for (let i = 0; i < 20000 && !found; i++) found = makeName(ctx)?.text === example;
      expect(found, example).toBe(true);
    });
  }
});

describe('rarity', () => {
  const draws = 30000;
  const shares = (mode: RarityMode) => {
    const counts = { common: 0, normal: 0, rare: 0 };
    for (let i = 0; i < draws; i++) counts[pickEntry(WORDS.adjective, mode, DEFAULTS).tier]++;
    return { common: counts.common / draws, normal: counts.normal / draws, rare: counts.rare / draws };
  };

  it('per tier, splits draws by the tier shares', () => {
    const s = shares('tier');
    expect(s.common).toBeCloseTo(0.5, 1);
    expect(s.normal).toBeCloseTo(0.33, 1);
    expect(s.rare).toBeCloseTo(0.17, 1);
  });

  it('per word, matches the split the Weights panel shows', () => {
    const s = shares('word');
    const expected = tierMass(WORDS.adjective, DEFAULTS.wordMult);
    expect(s.common).toBeCloseTo(expected.common, 1);
    expect(s.normal).toBeCloseTo(expected.normal, 1);
    expect(s.rare).toBeCloseTo(expected.rare, 1);
  });
});
