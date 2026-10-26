import { describe, expect, it } from 'vitest';
import { CATEGORIES, WORDS } from '@/data';
import { PAIRED_BODY_PARTS, slotsOf } from '@/functions';

// These run in CI before every deploy, so a mistake in a CSV edit stops the site from updating.
describe('word lists', () => {
  it('give every category at least one word', () => {
    for (const category of CATEGORIES) expect(WORDS[category.id].length, category.id).toBeGreaterThan(0);
  });

  it('never list the same word twice in one category', () => {
    for (const category of CATEGORIES) {
      const words = WORDS[category.id].map((e) => e.word.toLowerCase());
      const repeats = words.filter((w, i) => words.indexOf(w) !== i);
      expect(repeats, category.id).toEqual([]);
    }
  });

  it('only give plurals to nouns', () => {
    for (const category of CATEGORIES.filter((c) => c.group !== 'noun')) {
      expect(WORDS[category.id].filter((e) => e.plural).map((e) => e.word), category.id).toEqual([]);
    }
  });

  it('give every noun category used after a number at least one plural', () => {
    for (const category of CATEGORIES.filter((c) => slotsOf(c).includes('number'))) {
      expect(WORDS[category.id].some((e) => e.plural), category.id).toBe(true);
    }
  });

  it('have no stray spaces around words', () => {
    for (const category of CATEGORIES) {
      for (const e of WORDS[category.id]) expect(e.word, category.id).toBe(e.word.trim());
    }
  });

  it('give every paired body part in the plural rule a plural', () => {
    for (const word of PAIRED_BODY_PARTS) {
      expect(WORDS['body part'].find((e) => e.word === word)?.plural, word).toBeTruthy();
    }
  });

  it('include "of" among the prepositions', () => {
    expect(WORDS.preposition.map((e) => e.word)).toContain('of');
  });
});
