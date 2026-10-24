import { chance, needMet } from '@/functions';
import type { GeneratorContext, Need, OptionRule, Pattern, PatternOption } from '@/types';

/** The key an optional part's on/off state and chance are stored under. */
export function optionKey(patternId: string, optionId: string): string {
  return `${patternId}.${optionId}`;
}

/** The keys of every optional part of the given patterns. */
export function optionKeys(patterns: readonly Pattern[]): string[] {
  return patterns.flatMap((p) => (p.options ?? []).map((o) => optionKey(p.id, o.id)));
}

export function optionName(option: PatternOption): string {
  return option.name ?? option.label;
}

function findOption(pattern: Pattern, id: string): PatternOption {
  const option = pattern.options?.find((o) => o.id === id);
  if (!option) throw new Error(`Pattern ${pattern.id} has no optional part "${id}".`);
  return option;
}

/** The sources an optional part is missing under the current chips; empty when it can appear. */
export function optionMissing(option: PatternOption, ctx: GeneratorContext): Need[] {
  return (option.needs ?? []).filter((need) => !needMet(need, ctx));
}

/**
 * The chance, from 0 to 1, that a name from this pattern includes each optional part. A part that is
 * switched off or missing its sources has no chance, and ruled pairs are scaled as their rule says.
 */
export function optionChances(pattern: Pattern, ctx: GeneratorContext): Record<string, number> {
  const chances: Record<string, number> = {};
  for (const option of pattern.options ?? []) {
    const key = optionKey(pattern.id, option.id);
    const usable = ctx.enabled[key] && optionMissing(option, ctx).length === 0;
    chances[option.id] = usable ? Math.min(100, ctx.weights.options[key] ?? option.chance) / 100 : 0;
  }
  for (const { kind, options: [a, b] } of pattern.rules ?? []) {
    const sum = chances[a] + chances[b];
    if (sum > 0 && (kind === 'atLeastOne' ? sum < 1 : sum > 1)) {
      chances[a] /= sum;
      chances[b] /= sum;
    }
  }
  return chances;
}

/** The at-least-one rules that neither part can satisfy, which leave the pattern unable to run. */
export function blockedRules(pattern: Pattern, ctx: GeneratorContext): OptionRule[] {
  const chances = optionChances(pattern, ctx);
  return (pattern.rules ?? []).filter((r) => r.kind === 'atLeastOne' && chances[r.options[0]] + chances[r.options[1]] === 0);
}

/** Decides which optional parts one name includes. */
export function rollOptions(pattern: Pattern, ctx: GeneratorContext): Set<string> {
  const chances = optionChances(pattern, ctx);
  const ruled = new Set((pattern.rules ?? []).flatMap((r) => r.options));
  const chosen = new Set<string>();
  for (const option of pattern.options ?? []) {
    if (!ruled.has(option.id) && chance(chances[option.id])) chosen.add(option.id);
  }
  // A ruled pair shares one roll: the first part takes the bottom of the range and the second the top,
  // so they overlap only as much as at-least-one forces, and at-most-one pairs (scaled to fit) never do.
  for (const { options: [a, b] } of pattern.rules ?? []) {
    const roll = Math.random();
    if (roll < chances[a]) chosen.add(a);
    if (roll >= 1 - chances[b]) chosen.add(b);
  }
  return chosen;
}

/** A rule in words, for the chip's menu and the Weights panel. */
export function ruleText(pattern: Pattern, rule: OptionRule): string {
  const [a, b] = rule.options.map((id) => optionName(findOption(pattern, id)));
  return rule.kind === 'atLeastOne'
    ? `Every name has ${a}, ${b} or both. If their chances add up to less than 100%, both are scaled up to make 100%.`
    : `No name has both ${a} and ${b}. If their chances add up to more than 100%, both are scaled down to make 100%.`;
}

/**
 * The chip label. Each {id} placeholder becomes [Label], or is dropped when `shown` says the part can't
 * appear; {a/b} shows two parts that share a position as [A/B].
 */
export function patternLabel(pattern: Pattern, shown: (option: string) => boolean = () => true): string {
  return pattern.label
    .replace(/\{([^}]+)\}/g, (_, ids: string) => {
      const options = ids.split('/').map((id) => findOption(pattern, id));
      const visible = options.filter((o) => shown(o.id));
      return visible.length ? `[${visible.map((o) => o.label).join('/')}]` : (options[0].offText ?? '');
    })
    .replace(/\s+/g, ' ')
    .trim();
}
