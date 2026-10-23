import { TIERS } from '@/types';
import type { Category, Tier, WordEntry } from '@/types';

const HEADER = ['word', 'plural', 'category', 'tier'];

/**
 * Parses CSV text into rows of cells. Handles a leading byte-order mark (Excel adds one), quoted
 * cells with commas or doubled quotes inside, and Windows or Unix line endings. Blank lines are skipped.
 */
export function parseCsv(text: string): string[][] {
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  const endCell = () => {
    row.push(cell);
    cell = '';
  };
  const endRow = () => {
    endCell();
    if (row.some((value) => value.trim() !== '')) rows.push(row);
    row = [];
  };

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (quoted) {
      if (ch === '"' && source[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      endCell();
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && source[i + 1] === '\n') i++;
      endRow();
    } else {
      cell += ch;
    }
  }
  if (cell !== '' || row.length) endRow();
  return rows;
}

/**
 * Reads one word CSV into entries, checking the header, the category and the tier of every row.
 * Errors name the file and line so a bad edit is easy to find.
 */
export function parseWordTable(
  text: string,
  source: string,
  validCategories: readonly Category[],
): WordEntry[] {
  const rows = parseCsv(text);
  const header = (rows[0] ?? []).map((cell) => cell.trim().toLowerCase());
  if (HEADER.some((name, i) => header[i] !== name)) {
    throw new Error(`${source}: the first line must be "${HEADER.join(',')}", found "${header.join(',')}"`);
  }

  return rows.slice(1).map((cells, index) => {
    const line = index + 2;
    const [word = '', plural = '', category = '', tier = ''] = cells.map((cell) => cell.trim());
    if (!word) throw new Error(`${source} line ${line}: the word is empty`);
    if (!validCategories.includes(category as Category)) {
      throw new Error(`${source} line ${line}: "${category}" is not a category this file allows (${validCategories.join(', ')})`);
    }
    const normalTier = (tier || 'normal').toLowerCase();
    if (!TIERS.includes(normalTier as Tier)) {
      throw new Error(`${source} line ${line}: tier "${tier}" must be one of ${TIERS.join(', ')}`);
    }
    return { word, plural: plural || null, category: category as Category, tier: normalTier as Tier };
  });
}
