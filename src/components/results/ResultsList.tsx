import { ResultRow } from '@/components';
import type { GeneratedName } from '@/types';

interface ResultsListProps {
  names: GeneratedName[];
  isKept: (text: string) => boolean;
  onToggleKept: (text: string) => void;
}

/** The current batch of generated names. */
export function ResultsList({ names, isKept, onToggleKept }: ResultsListProps) {
  return (
    <ul className="results">
      {names.length === 0 ? (
        <li className="empty">Press Generate.</li>
      ) : (
        names.map((name) => (
          <ResultRow key={name.text} name={name} kept={isKept(name.text)} onToggleKept={onToggleKept} />
        ))
      )}
    </ul>
  );
}
