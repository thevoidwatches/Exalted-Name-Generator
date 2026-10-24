import { PATTERNS, categoriesIn, createHelpers, nounsForSlot, pickWeighted } from '@/functions';
import type { GeneratedName, GeneratorContext, Need, Pattern } from '@/types';

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
    case 'title':
      return nounsForSlot(ctx, 'title').length > 0;
    case 'gerundOrCardinal':
      return on('gerund') || on('cardinal');
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

const weightOf = (pattern: Pattern, ctx: GeneratorContext) => ctx.weights.patterns[pattern.id] ?? pattern.weight;

/** Patterns that are switched on, have what they need, and have a weight above zero. */
export function activePatterns(ctx: GeneratorContext, patterns: Pattern[] = PATTERNS): Pattern[] {
  return patterns.filter((p) => ctx.enabled[p.id] && weightOf(p, ctx) > 0 && missingNeeds(p, ctx).length === 0);
}

/** Builds one name, or null if no pattern can run. Retries when a name would repeat a word. */
export function makeName(ctx: GeneratorContext, patterns: Pattern[] = PATTERNS): GeneratedName | null {
  const pool = activePatterns(ctx, patterns);
  if (!pool.length) return null;
  const pattern = pickWeighted(pool.map((p) => [p, weightOf(p, ctx)] as const));
  const helpers = createHelpers(ctx);
  for (let tries = 0; tries < 12; tries++) {
    const parts = pattern.build(helpers);
    const bases = parts.flatMap((p) => (p.base ? [p.base.toLowerCase()] : []));
    if (new Set(bases).size !== bases.length) continue;
    const joiner = pattern.joiner?.() ?? ' ';
    return {
      text: parts.map((p) => p.text).join(joiner),
      form: parts.flatMap((p) => (p.kind ? [p.kind] : [])).join(' · '),
      patternId: pattern.id,
      parts,
    };
  }
  return null;
}

/** A batch of distinct names. May come up short if the chips leave very few combinations. */
export function generateBatch(count: number, ctx: GeneratorContext, patterns: Pattern[] = PATTERNS): GeneratedName[] {
  const seen = new Set<string>();
  const names: GeneratedName[] = [];
  for (let i = 0; i < count * 4 && names.length < count; i++) {
    const name = makeName(ctx, patterns);
    if (!name) break;
    if (seen.has(name.text)) continue;
    seen.add(name.text);
    names.push(name);
  }
  return names;
}

/** The status line beside the Generate button. */
export function availabilityHint(ctx: GeneratorContext, patterns: Pattern[] = PATTERNS): string {
  if (!needMet('noun', ctx)) return 'Turn on at least one noun source.';
  const active = activePatterns(ctx, patterns).length;
  if (!active) return 'No pattern can run with these sources.';
  return `${active} of ${patterns.length} patterns active`;
}
