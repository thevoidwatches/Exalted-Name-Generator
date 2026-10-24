import { categoriesIn, nounsForSlot } from '@/functions';
import type { GeneratorContext, Need, Pattern } from '@/types';

export function needMet(need: Need, ctx: GeneratorContext): boolean {
  const on = (id: string) => !!ctx.enabled[id];
  switch (need) {
    case 'modifier':
      return categoriesIn(ctx, 'modifier').some((c) => on(c.id));
    case 'noun':
      return categoriesIn(ctx, 'noun').some((c) => on(c.id));
    case 'adjective':
      return on('adjective');
    case 'nature':
      return on('nature');
    case 'ordinal':
      return on('ordinal');
    case 'cardinal':
      return on('cardinal');
    case 'title':
      return nounsForSlot(ctx, 'title').length > 0;
    case 'ordinalOrModifier':
      return on('ordinal') || needMet('modifier', ctx);
    case 'adjectiveOrGerund':
      return on('adjective') || on('gerund');
    case 'colorOrMaterial':
      return on('color') || on('material');
  }
}

/** The needs a pattern is missing under the current chips; empty when it can run. */
export function missingNeeds(pattern: Pattern, ctx: GeneratorContext): Need[] {
  return pattern.needs.filter((need) => !needMet(need, ctx));
}

/** How each need is described when a pattern or part is unavailable. */
export const NEED_LABELS: Record<Need, string> = {
  modifier: 'a modifier source',
  noun: 'a noun source',
  adjective: 'Adjectives',
  nature: 'Nature',
  title: 'People or Epithets',
  ordinal: 'Ordinals',
  cardinal: 'Cardinals',
  ordinalOrModifier: 'Ordinals or a modifier source',
  adjectiveOrGerund: 'Adjectives or Gerunds',
  colorOrMaterial: 'Colors or Materials',
};

/** A list of needs as one phrase, e.g. "Nature and a noun source". */
export function describeNeeds(needs: readonly Need[]): string {
  return needs.map((need) => NEED_LABELS[need]).join(' and ');
}
