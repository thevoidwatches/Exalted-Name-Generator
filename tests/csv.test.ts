import { describe, expect, it } from 'vitest';
import { parseCsv, parseWordTable } from '@/functions';

describe('parseCsv', () => {
  it('splits rows and cells', () => {
    expect(parseCsv('a,b\nc,d\n')).toEqual([['a', 'b'], ['c', 'd']]);
  });

  it('ignores a byte-order mark, Windows line endings and blank lines', () => {
    expect(parseCsv('﻿a,b\r\n\r\nc,d')).toEqual([['a', 'b'], ['c', 'd']]);
  });

  it('keeps commas and doubled quotes inside quoted cells', () => {
    expect(parseCsv('"Beneath, Above","say ""hi"""\n')).toEqual([['Beneath, Above', 'say "hi"']]);
  });

  it('keeps empty cells', () => {
    expect(parseCsv('Gold,,material,common')).toEqual([['Gold', '', 'material', 'common']]);
  });
});

describe('parseWordTable', () => {
  const header = 'word,plural,category,tier\n';

  it('reads entries and turns a blank plural into null', () => {
    expect(parseWordTable(`${header}Wolf,Wolves,animal,common\nBlood,,body part,normal\n`, 'test.csv', ['animal', 'body part'])).toEqual([
      { word: 'Wolf', plural: 'Wolves', category: 'animal', tier: 'common' },
      { word: 'Blood', plural: null, category: 'body part', tier: 'normal' },
    ]);
  });

  it('treats a missing tier as normal and accepts any capitalisation', () => {
    expect(parseWordTable(`${header}Wolf,Wolves,animal,\nFox,Foxes,animal,RARE\n`, 'test.csv', ['animal']).map((e) => e.tier)).toEqual(['normal', 'rare']);
  });

  it('names the file and line of a bad tier', () => {
    expect(() => parseWordTable(`${header}Wolf,Wolves,animal,legendary\n`, 'nouns.csv', ['animal'])).toThrow(/nouns\.csv line 2/);
  });

  it('rejects a category that belongs in another file', () => {
    expect(() => parseWordTable(`${header}Gold,,material,common\n`, 'nouns.csv', ['animal'])).toThrow(/"material" is not a category/);
  });

  it('rejects a missing or wrong header', () => {
    expect(() => parseWordTable('Wolf,Wolves,animal,common\n', 'nouns.csv', ['animal'])).toThrow(/first line/);
  });
});
