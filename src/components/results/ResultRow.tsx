import { KEPT_MARK } from '@/styles';
import type { GeneratedName } from '@/types';

interface ResultRowProps {
  name: GeneratedName;
  kept: boolean;
  onToggleKept: (text: string) => void;
}

/** One generated name with its form underneath and a keep toggle beside it. */
export function ResultRow({ name, kept, onToggleKept }: ResultRowProps) {
  return (
    <li>
      <div>
        <button type="button" className="name" title="Keep this name" onClick={() => onToggleKept(name.text)}>
          {name.text}
        </button>
        <div className="form">{name.form}</div>
      </div>
      <button
        type="button"
        className={kept ? 'star on' : 'star'}
        aria-label={`${kept ? 'Remove' : 'Keep'} ${name.text}`}
        onClick={() => onToggleKept(name.text)}
      >
        {kept ? KEPT_MARK.on : KEPT_MARK.off}
      </button>
    </li>
  );
}
