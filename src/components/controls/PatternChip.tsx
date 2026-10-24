import { useEffect, useRef } from 'react';
import { Chip, PartMenu } from '@/components';
import type { GeneratorContext, Pattern } from '@/types';

interface PatternChipProps {
  pattern: Pattern;
  /** The label for the current settings, with parts that can't appear left out. */
  label: string;
  pressed: boolean;
  disabled: boolean;
  title: string;
  ctx: GeneratorContext;
  menuOpen: boolean;
  /** Toggles a pattern or optional-part id. */
  onToggle: (id: string) => void;
  onMenuChange: (open: boolean) => void;
}

/** A pattern's chip, joined to a ▾ button that opens the menu of its optional parts when it has any. */
export function PatternChip({
  pattern,
  label,
  pressed,
  disabled,
  title,
  ctx,
  menuOpen,
  onToggle,
  onMenuChange,
}: PatternChipProps) {
  const wrap = useRef<HTMLSpanElement>(null);
  const more = useRef<HTMLButtonElement>(null);

  // While the menu is open, a click anywhere outside the chip or the Escape key closes it.
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) onMenuChange(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      onMenuChange(false);
      more.current?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen, onMenuChange]);

  const chip = (
    <Chip
      label={label}
      note={pattern.example}
      pressed={pressed}
      disabled={disabled}
      title={title}
      onClick={() => onToggle(pattern.id)}
    />
  );
  if (!pattern.options?.length) return chip;

  const menuId = `parts-${pattern.id}`;
  return (
    <span ref={wrap} className={pressed && !disabled ? 'chip-pair on' : 'chip-pair'}>
      {chip}
      <button
        ref={more}
        type="button"
        className="chip-more"
        aria-expanded={menuOpen}
        aria-controls={menuOpen ? menuId : undefined}
        aria-label={`Optional parts of ${label}`}
        title="Optional parts"
        onClick={() => onMenuChange(!menuOpen)}
      >
        ▾
      </button>
      {menuOpen && <PartMenu id={menuId} pattern={pattern} ctx={ctx} onToggle={onToggle} />}
    </span>
  );
}
