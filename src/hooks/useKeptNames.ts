import { useCallback } from 'react';
import { STORAGE_KEYS } from '@/functions';
import { usePersistentState } from '@/hooks';

const toNameList = (raw: unknown): string[] =>
  Array.isArray(raw) ? raw.filter((item): item is string => typeof item === 'string') : [];

/** The names the user has kept, remembered in this browser. */
export function useKeptNames() {
  const [names, setNames] = usePersistentState<string[]>(STORAGE_KEYS.keptNames, [], toNameList);

  const isKept = useCallback((name: string) => names.includes(name), [names]);
  const toggle = useCallback(
    (name: string) => setNames((list) => (list.includes(name) ? list.filter((n) => n !== name) : [...list, name])),
    [setNames],
  );
  const clear = useCallback(() => setNames([]), [setNames]);

  return { names, isKept, toggle, clear };
}
