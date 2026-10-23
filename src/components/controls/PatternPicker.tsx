import { Chip, ChipGroup, TextButton } from '@/components';
import { NEED_LABELS } from '@/functions';
import type { Need, Pattern } from '@/types';

interface PatternPickerProps {
  patterns: Pattern[];
  enabled: Record<string, boolean>;
  /** What each pattern is missing under the current sources; a pattern missing anything is shown disabled. */
  missing: (pattern: Pattern) => Need[];
  onToggle: (id: string) => void;
  onSetAll: (on: boolean) => void;
}

/** The pattern chips, with "all" and "none" shortcuts. */
export function PatternPicker({ patterns, enabled, missing, onToggle, onSetAll }: PatternPickerProps) {
  return (
    <ChipGroup
      label="Patterns"
      aside="[brackets] mark optional parts"
      actions={
        <>
          <TextButton label="all" title="Turn every pattern on" onClick={() => onSetAll(true)} />
          <TextButton label="none" title="Turn every pattern off" onClick={() => onSetAll(false)} />
        </>
      }
    >
      {patterns.map((pattern) => {
        const needs = missing(pattern);
        const title = needs.length
          ? `Unavailable: needs ${needs.map((n) => NEED_LABELS[n]).join(' and ')} turned on. ${pattern.tip}`
          : pattern.tip;
        return (
          <Chip
            key={pattern.id}
            label={pattern.label}
            note={pattern.example}
            pressed={!!enabled[pattern.id]}
            disabled={needs.length > 0}
            title={title}
            onClick={() => onToggle(pattern.id)}
          />
        );
      })}
    </ChipGroup>
  );
}
