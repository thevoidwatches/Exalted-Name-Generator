import { useState } from 'react';
import type { CSSProperties } from 'react';

interface WeightRowProps {
  id: string;
  label: string;
  note?: string;
  value: number;
  /** The value at the right end of the bar. */
  scale: number;
  step: number;
  max?: number;
  percent?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
  /** Called with true while the user drags or types, so the chart can hold its scale still. */
  onInteract: (active: boolean) => void;
}

/** One weight: a draggable bar, a number box and its share of the chart. */
export function WeightRow({
  id,
  label,
  note,
  value,
  scale,
  step,
  max,
  percent,
  disabled,
  onChange,
  onInteract,
}: WeightRowProps) {
  // While the number box has focus, show what the user typed, even half-finished input like "1.".
  const [draft, setDraft] = useState<string | null>(null);

  const commit = (raw: string) => {
    const parsed = parseFloat(raw);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    onChange(max !== undefined ? Math.min(max, parsed) : parsed);
  };
  const fill = `${(100 * Math.min(1, scale > 0 ? value / scale : 0)).toFixed(1)}%`;
  const inputId = `weight-${id}`;

  return (
    <div className="wrow">
      <label htmlFor={inputId}>
        {label}
        {note && <small>{note}</small>}
      </label>
      <input
        type="range"
        className="wbar"
        min={0}
        max={scale}
        step={step}
        value={value}
        disabled={disabled}
        aria-label={`${label} weight`}
        style={{ '--fill': fill } as CSSProperties}
        onChange={(e) => commit(e.target.value)}
        onPointerDown={() => onInteract(true)}
        onPointerUp={() => onInteract(false)}
        onBlur={() => onInteract(false)}
      />
      <input
        type="number"
        id={inputId}
        min={0}
        max={max}
        step={step}
        value={draft ?? String(value)}
        disabled={disabled}
        onFocus={() => {
          setDraft(String(value));
          onInteract(true);
        }}
        onChange={(e) => {
          setDraft(e.target.value);
          commit(e.target.value);
        }}
        onBlur={() => {
          setDraft(null);
          onInteract(false);
        }}
      />
      <span className="pct">{percent}</span>
    </div>
  );
}
