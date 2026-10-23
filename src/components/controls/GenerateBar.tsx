import { BATCH_SIZES } from '@/styles';

interface GenerateBarProps {
  count: number;
  hint: string;
  onCountChange: (count: number) => void;
  onGenerate: () => void;
  onOpenWeights: () => void;
}

/** The Generate button, batch size, Weights button and status line. */
export function GenerateBar({ count, hint, onCountChange, onGenerate, onOpenWeights }: GenerateBarProps) {
  return (
    <div className="actions">
      <button type="button" className="btn" onClick={onGenerate}>
        Generate
      </button>
      <select aria-label="How many names" value={count} onChange={(e) => onCountChange(Number(e.target.value))}>
        {BATCH_SIZES.map((size) => (
          <option key={size} value={size}>
            {size} names
          </option>
        ))}
      </select>
      <button type="button" className="btn quiet" title="View and adjust every weight" onClick={onOpenWeights}>
        Weights
      </button>
      <span className="hint">{hint}</span>
    </div>
  );
}
