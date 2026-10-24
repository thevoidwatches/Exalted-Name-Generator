import { useLayoutEffect, useRef, useState } from 'react';
import { Chip } from '@/components';
import { describeNeeds, optionKey, optionMissing, optionName, patternLabel, ruleText } from '@/functions';
import type { GeneratorContext, Pattern } from '@/types';

interface PartMenuProps {
  id: string;
  pattern: Pattern;
  ctx: GeneratorContext;
  onToggle: (key: string) => void;
}

/** The floating menu under a pattern chip that switches its optional parts on and off. */
export function PartMenu({ id, pattern, ctx, onToggle }: PartMenuProps) {
  const menu = useRef<HTMLDivElement>(null);
  // Nudge the menu left when it would run past the right edge of the page.
  const [shift, setShift] = useState(0);
  useLayoutEffect(() => {
    const rect = menu.current?.getBoundingClientRect();
    if (!rect) return;
    const overflow = rect.right - (document.documentElement.clientWidth - 16);
    if (overflow > 0) setShift(-overflow);
  }, []);

  return (
    <div
      ref={menu}
      id={id}
      className="part-menu"
      role="group"
      aria-label={`Optional parts of ${patternLabel(pattern)}`}
      style={shift ? { left: shift } : undefined}
    >
      <div className="label">Optional parts</div>
      <div className="chips">
        {(pattern.options ?? []).map((option) => {
          const key = optionKey(pattern.id, option.id);
          const missing = optionMissing(option, ctx);
          return (
            <Chip
              key={option.id}
              label={optionName(option)}
              note={`${ctx.weights.options[key] ?? option.chance}%`}
              pressed={!!ctx.enabled[key]}
              disabled={missing.length > 0}
              title={missing.length ? `Needs ${describeNeeds(missing)} turned on. ${option.tip}` : option.tip}
              onClick={() => onToggle(key)}
            />
          );
        })}
      </div>
      {(pattern.rules ?? []).map((rule) => (
        <p key={rule.options.join('/')} className="hint">
          {ruleText(pattern, rule)}
        </p>
      ))}
      <p className="hint">The percentages say how often each part appears; change them under Weights.</p>
    </div>
  );
}
