import modifiersCsv from '@/data/modifiers.csv?raw';
import nounsCsv from '@/data/nouns.csv?raw';
import numbersCsv from '@/data/numbers.csv?raw';
import prepositionsCsv from '@/data/prepositions.csv?raw';
import { CATEGORIES } from '@/data';
import { parseWordTable } from '@/functions';
import type { Category, CategoryGroup, WordEntry, WordIndex } from '@/types';

// The CSVs are bundled into the page at build time, so there is nothing to fetch at runtime.
const SOURCES: Array<[CategoryGroup, string, string]> = [
  ['modifier', 'modifiers.csv', modifiersCsv],
  ['number', 'numbers.csv', numbersCsv],
  ['noun', 'nouns.csv', nounsCsv],
  ['preposition', 'prepositions.csv', prepositionsCsv],
];

function buildIndex(): WordIndex {
  const index = Object.fromEntries(CATEGORIES.map((c) => [c.id, [] as WordEntry[]])) as WordIndex;
  for (const [group, file, text] of SOURCES) {
    const allowed: Category[] = CATEGORIES.filter((c) => c.group === group).map((c) => c.id);
    for (const entry of parseWordTable(text, file, allowed)) index[entry.category].push(entry);
  }
  return index;
}

/** Every word, grouped by category. */
export const WORDS: WordIndex = buildIndex();
