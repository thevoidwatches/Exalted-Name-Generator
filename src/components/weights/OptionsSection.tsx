import { WeightChart } from '@/components';
import { optionKey, optionName, patternLabel, ruleText } from '@/functions';
import type { Pattern, WeightConfig } from '@/types';

interface OptionsSectionProps {
  patterns: Pattern[];
  weights: WeightConfig;
  enabled: Record<string, boolean>;
  onChange: (key: string, value: number) => void;
  /** Sets the whole-name hyphenation chance, which ends the section. */
  onHyphenateChange: (value: number) => void;
  onReset: () => void;
}

/** The chance of each optional part in one small chart per pattern, then the whole-name hyphenation chance. */
export function OptionsSection({ patterns, weights, enabled, onChange, onHyphenateChange, onReset }: OptionsSectionProps) {
  const hyphenate = (
    <WeightChart
      key="hyphenate"
      rows={[{ id: 'hyphenate', label: 'Hyphenate whole name', value: weights.style.hyphenate }]}
      step={5}
      max={100}
      showPercent={false}
      onChange={(_, value) => onHyphenateChange(value)}
    >
      <p className="part-head">Every pattern but Surname Forename</p>
      <p className="hint">Joins every word of a name with hyphens: Shining-Omen-of-Falling-Stars.</p>
    </WeightChart>
  );

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
      after={<div className="wcols">{[...charts, hyphenate]}</div>}
    >
      <p className="hint">
        Unlike the other weights, these are percentages: how many of a pattern’s names include each bracketed part.
        Switch a part off altogether from the ▾ beside its chip.
      </p>
    </WeightChart>
  );
}
