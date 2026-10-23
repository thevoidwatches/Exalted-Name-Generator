import { describe, expect, it } from 'vitest';
import { CATEGORIES, WORDS } from '@/data';
import {
  PATTERNS,
  activePatterns,
  defaultWeights,
  generateBatch,
  makeName,
  missingNeeds,
  pickEntry,
  resetWeightSection,
  sanitizeWeights,
  slotsOf,
  tierMass,
} from '@/functions';
import type { Category, GeneratedName, GeneratorContext, RarityMode } from '@/types';

const DEFAULTS = defaultWeights(PATTERNS, CATEGORIES);
const ALL_IDS = [...PATTERNS.map((p) => p.id), ...CATEGORIES.map((c) => c.id)];

function context(options: { off?: string[]; onlyPattern?: string; rarityMode?: RarityMode } = {}): GeneratorContext {
  const off = new Set(options.off ?? []);
  if (options.onlyPattern) PATTERNS.forEach((p) => p.id !== options.onlyPattern && off.add(p.id));
  return {
    words: WORDS,
    categories: CATEGORIES,
    enabled: Object.fromEntries(ALL_IDS.map((id) => [id, !off.has(id)])),
    weights: DEFAULTS,
    rarityMode: options.rarityMode ?? 'tier',
  };
}

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
    describe(pattern.label, () => {
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
            if (!part.base || part.text === part.base || part.text === `${part.base}'s`) continue;
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

  it('disable the ordinal patterns when Ordinals is off', () => {
    const ctx = context({ off: ['ordinal'] });
    const disabled = PATTERNS.filter((p) => missingNeeds(p, ctx).length).map((p) => p.id);
    expect(disabled.sort()).toEqual(['ordModNoun', 'ordNoun']);
  });

  it('disable [Number] Noun [Gerund] only when Gerunds and Cardinals are both off', () => {
    const pattern = PATTERNS.find((p) => p.id === 'nounGerund')!;
    expect(missingNeeds(pattern, context({ off: ['gerund'] }))).toEqual([]);
    expect(missingNeeds(pattern, context({ off: ['cardinal'] }))).toEqual([]);
    expect(missingNeeds(pattern, context({ off: ['gerund', 'cardinal'] }))).toEqual(['gerundOrCardinal']);
  });

  it('need People or Epithets for Title of Noun', () => {
    const pattern = PATTERNS.find((p) => p.id === 'titleOf')!;
    expect(missingNeeds(pattern, context({ off: ['person'] }))).toEqual([]);
    expect(missingNeeds(pattern, context({ off: ['person', 'epithet'] }))).toEqual(['title']);
  });
});

describe('weights', () => {
  it('never draw a pattern weighted zero', () => {
    const ctx = { ...context(), weights: { ...DEFAULTS, patterns: { ...DEFAULTS.patterns, modNoun: 0 } } };
    expect(activePatterns(ctx).map((p) => p.id)).not.toContain('modNoun');
    expect(generateBatch(200, ctx).every((n) => n.patternId !== 'modNoun')).toBe(true);
  });

  it('fall back to defaults for missing or invalid stored values', () => {
    const merged = sanitizeWeights({ patterns: { modNoun: 3, hyphen: -1, bogus: 9 }, wordMult: 'nonsense' }, DEFAULTS);
    expect(merged.patterns.modNoun).toBe(3);
    expect(merged.patterns.hyphen).toBe(DEFAULTS.patterns.hyphen);
    expect(merged.patterns).not.toHaveProperty('bogus');
    expect(merged.wordMult).toEqual(DEFAULTS.wordMult);
    expect(sanitizeWeights(null, DEFAULTS)).toEqual(DEFAULTS);
  });

  it('reset one section without touching the others', () => {
    const changed = {
      ...DEFAULTS,
      patterns: { ...DEFAULTS.patterns, modNoun: 1 },
      categories: { ...DEFAULTS.categories, adjective: 1, animal: 1 },
    };
    const reset = resetWeightSection(changed, DEFAULTS, 'modifiers', CATEGORIES);
    expect(reset.categories.adjective).toBe(DEFAULTS.categories.adjective);
    expect(reset.categories.animal).toBe(1);
    expect(reset.patterns.modNoun).toBe(1);
  });
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
