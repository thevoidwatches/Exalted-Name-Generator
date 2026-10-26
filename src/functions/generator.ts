import {
  PATTERNS,
  blockedRules,
  chance,
  createHelpers,
  describeNeeds,
  missingNeeds,
  needMet,
  optionKey,
  optionMissing,
  optionName,
  pickWeighted,
  rollOptions,
} from '@/functions';
import type { GeneratedName, GeneratorContext, Pattern, PatternOption } from '@/types';

/** Why a pattern can't run under the current chips, for its tooltip, or null when it can. */
export function unavailableReason(pattern: Pattern, ctx: GeneratorContext): string | null {
  const needs = missingNeeds(pattern, ctx);
  if (needs.length) return `needs ${describeNeeds(needs)} turned on`;
  const rule = blockedRules(pattern, ctx)[0];
  if (!rule) return null;
  const [a, b] = rule.options.map((id) => pattern.options!.find((o) => o.id === id)!);
  const why = (option: PatternOption) => {
    const missing = optionMissing(option, ctx);
    if (!ctx.enabled[optionKey(pattern.id, option.id)]) return `${optionName(option)} is switched off`;
    if (missing.length) return `${optionName(option)} needs ${describeNeeds(missing)} turned on`;
    return `${optionName(option)} is set to 0%`;
  };
  return `needs ${optionName(a)} or ${optionName(b)}, but ${why(a)} and ${why(b)}`;
}

const weightOf = (pattern: Pattern, ctx: GeneratorContext) => ctx.weights.patterns[pattern.id] ?? pattern.weight;

/** Patterns that are switched on, have what they need, and have a weight above zero. */
export function activePatterns(ctx: GeneratorContext, patterns: Pattern[] = PATTERNS): Pattern[] {
  return patterns.filter((p) => ctx.enabled[p.id] && weightOf(p, ctx) > 0 && unavailableReason(p, ctx) === null);
}

/** Builds one name, or null if no pattern can run. Retries when a name would repeat a word. */
export function makeName(ctx: GeneratorContext, patterns: Pattern[] = PATTERNS): GeneratedName | null {
  const pool = activePatterns(ctx, patterns);
  if (!pool.length) return null;
  const pattern = pickWeighted(pool.map((p) => [p, weightOf(p, ctx)] as const));
  const helpers = createHelpers(ctx);
  for (let tries = 0; tries < 12; tries++) {
    const chosen = rollOptions(pattern, ctx);
    const parts = pattern.build(helpers, (option) => chosen.has(option));
    const bases = parts.flatMap((p) => (p.base ? [p.base.toLowerCase()] : []));
    if (new Set(bases).size !== bases.length) continue;
    const text = parts.map((p, i) => (i ? (p.joinBefore ?? ' ') : '') + p.text).join('');
    // The whole-name style joins every word with hyphens: Shining-Omen-of-Falling-Stars.
    const hyphenate = !pattern.noHyphenStyle && chance(ctx.weights.style.hyphenate / 100);
    return {
      text: hyphenate ? text.replace(/ /g, '-') : text,
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
  const active = activePatterns(ctx, patterns).length;
  if (!active && !needMet('noun', ctx)) return 'Turn on at least one noun source.';
  if (!active) return 'No pattern can run with these sources.';
  return `${active} of ${patterns.length} patterns active`;
}
