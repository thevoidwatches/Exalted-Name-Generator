import { WeightChart } from '@/components';
import { optionKey, optionName, patternLabel, ruleText } from '@/functions';
import type { Pattern, WeightConfig } from '@/types';

interface OptionsSectionProps {
  patterns: Pattern[];
  weights: WeightConfig;
  enabled: Record<string, boolean>;
  onChange: (key: string, value: number) => void;
  onReset: () => void;
}

/** The chance of each optional part, in one small chart per pattern that has any. */
export function OptionsSection({ patterns, weights, enabled, onChange, onReset }: OptionsSectionProps) {
  const charts = patterns
    .filter((p) => p.options?.length)
    .map((pattern) => (
      <WeightChart
        key={pattern.id}
        rows={pattern.options!.map((option) => {
          const key = optionKey(pattern.id, option.id);
          return {
            id: key,
            // A zero-width space lets "Gerund/Adjective" wrap at the slash on a narrow screen.
            label: optionName(option).replaceAll('/', '/​'),
            note: enabled[key] ? undefined : 'switched off',
            value: weights.options[key] ?? option.chance,
          };
        })}
        step={5}
        max={100}
        showPercent={false}
        onChange={onChange}
      >
        <p className="part-head">{patternLabel(pattern)}</p>
        {(pattern.rules ?? []).map((rule) => (
          <p key={rule.options.join('/')} className="hint">
            {ruleText(pattern, rule)}
          </p>
        ))}
      </WeightChart>
    ));

  return (
    <WeightChart
      title="Optional parts"
      rows={[]}
      onChange={onChange}
      onReset={onReset}
      wide
      after={<div className="wcols">{charts}</div>}
    >
      <p className="hint">
        Unlike the other weights, these are percentages: how many of a pattern’s names include each bracketed part.
        Switch a part off altogether from the ▾ beside its chip.
      </p>
    </WeightChart>
  );
}
