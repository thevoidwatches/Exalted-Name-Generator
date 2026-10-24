import { useState } from 'react';
import { ChipGroup, PatternChip, TextButton } from '@/components';
import { optionChances, patternLabel, unavailableReason } from '@/functions';
import type { GeneratorContext, Pattern } from '@/types';

interface PatternPickerProps {
  patterns: Pattern[];
  /** The page state, which decides what each pattern can use and how its chip is labelled. */
  ctx: GeneratorContext;
  /** Toggles a pattern or optional-part id. */
  onToggle: (id: string) => void;
  onSetAll: (on: boolean) => void;
}

/** The pattern chips, with "all" and "none" shortcuts. At most one chip's menu is open at a time. */
export function PatternPicker({ patterns, ctx, onToggle, onSetAll }: PatternPickerProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <ChipGroup
      label="Patterns"
      aside="[brackets] mark optional parts; ▾ switches them"
      actions={
        <>
          <TextButton label="all" title="Turn every pattern on" onClick={() => onSetAll(true)} />
          <TextButton label="none" title="Turn every pattern off" onClick={() => onSetAll(false)} />
        </>
      }
    >
      {patterns.map((pattern) => {
        const reason = unavailableReason(pattern, ctx);
        const chances = optionChances(pattern, ctx);
        return (
          <PatternChip
            key={pattern.id}
            pattern={pattern}
            label={patternLabel(pattern, (id) => chances[id] > 0)}
            pressed={!!ctx.enabled[pattern.id]}
            disabled={reason !== null}
            title={reason ? `Unavailable: ${reason}. ${pattern.tip}` : pattern.tip}
            ctx={ctx}
            menuOpen={openMenu === pattern.id}
            onToggle={onToggle}
            onMenuChange={(open) => setOpenMenu(open ? pattern.id : null)}
          />
        );
      })}
    </ChipGroup>
  );
}
