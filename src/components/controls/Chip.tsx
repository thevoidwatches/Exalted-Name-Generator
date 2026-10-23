interface ChipProps {
  label: string;
  /** Small italic text after the label, such as a pattern's example. */
  note?: string;
  pressed: boolean;
  disabled?: boolean;
  title?: string;
  /** Use 'radio' when the chip is one of a set where exactly one is chosen. */
  role?: 'radio';
  onClick: () => void;
}

/** A rounded toggle button. */
export function Chip({ label, note, pressed, disabled, title, role, onClick }: ChipProps) {
  const state = role === 'radio' ? { role, 'aria-checked': pressed } : { 'aria-pressed': pressed };
  return (
    <button type="button" className="chip" title={title} disabled={disabled} onClick={onClick} {...state}>
      {label}
      {note && <small>{note}</small>}
    </button>
  );
}
