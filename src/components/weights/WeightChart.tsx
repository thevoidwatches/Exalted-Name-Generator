import { useState } from 'react';
import type { ReactNode } from 'react';
import { TextButton, WeightRow } from '@/components';
import { chartScale, percentOf } from '@/functions';

export interface ChartRow {
  id: string;
  label: string;
  note?: string;
  value: number;
  disabled?: boolean;
}

interface WeightChartProps {
  title?: string;
  rows: ChartRow[];
  onChange: (id: string, value: number) => void;
  step?: number;
  /** A fixed top of scale, such as 100 for percentages. Otherwise the scale follows the values. */
  max?: number;
  showPercent?: boolean;
  onReset?: () => void;
  /** Extra controls in the header, before the "default" link. */
  tools?: ReactNode;
  wide?: boolean;
  /** Shown between the header and the bars. */
  children?: ReactNode;
  /** Shown below the bars. */
  after?: ReactNode;
}

/** A titled bar chart of weights in their default order, where each bar can be dragged or typed into. */
export function WeightChart({
  title,
  rows,
  onChange,
  step = 1,
  max,
  showPercent = true,
  onReset,
  tools,
  wide,
  children,
  after,
}: WeightChartProps) {
  const values = rows.map((r) => r.value);
  const natural = max ?? chartScale(values, step);
  // While a bar is being dragged or typed into, hold the scale still unless a value outgrows it.
  const [frozen, setFrozen] = useState<number | null>(null);
  const scale = frozen !== null && Math.max(0, ...values) <= frozen ? frozen : natural;
  const total = values.reduce((sum, v) => sum + v, 0);
  const hasHeader = Boolean(title || tools || onReset);

  return (
    <div className={wide ? 'wsec wide' : 'wsec'}>
      {hasHeader && (
        <div className="wsec-head">
          {title && <h3>{title}</h3>}
          {(tools || onReset) && (
            <span className="wsec-tools">
              {tools}
              {onReset && <TextButton label="default" title="Reset this set to its defaults" onClick={onReset} />}
            </span>
          )}
        </div>
      )}
      {children}
      {rows.length > 0 && (
        <div className="wchart">
          {rows.map((row) => (
            <WeightRow
              key={row.id}
              id={row.id}
              label={row.label}
              note={row.note}
              value={row.value}
              scale={scale}
              step={step}
              max={max}
              disabled={row.disabled}
              percent={showPercent ? `${percentOf(row.value, total)}%` : ''}
              onChange={(value) => onChange(row.id, value)}
              onInteract={(active) => setFrozen(active ? scale : null)}
            />
          ))}
        </div>
      )}
      {after}
    </div>
  );
}
