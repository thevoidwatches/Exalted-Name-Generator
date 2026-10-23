import type { ReactNode } from 'react';

interface ChipGroupProps {
  label: string;
  /** Small text buttons beside the label, such as "all" and "none". */
  actions?: ReactNode;
  /** Right-aligned italic note on the label line. */
  aside?: string;
  children: ReactNode;
}

/** A labelled row of chips. */
export function ChipGroup({ label, actions, aside, children }: ChipGroupProps) {
  return (
    <div className="group">
      <div className="label">
        {label}
        {actions}
        {aside && <span className="key">{aside}</span>}
      </div>
      <div className="chips">{children}</div>
    </div>
  );
}
