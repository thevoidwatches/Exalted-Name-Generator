import { useCallback, useMemo } from 'react';
import { usePersistentState } from '@/hooks';

/** Keeps a saved on/off value for each known id; ids that are new or were stored badly start on. */
const toToggles = (raw: unknown, ids: readonly string[]): Record<string, boolean> => {
  const saved = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return Object.fromEntries(ids.map((id) => [id, typeof saved[id] === 'boolean' ? saved[id] : true]));
};

/** On/off state for a set of chips, all on to start, remembered in this browser under the given key. */
export function useToggles(key: string, ids: readonly string[]) {
  const defaults = useMemo(() => toToggles(null, ids), [ids]);
  const [enabled, setEnabled] = usePersistentState<Record<string, boolean>>(key, defaults, (raw) => toToggles(raw, ids));
  const toggle = useCallback((id: string) => setEnabled((current) => ({ ...current, [id]: !current[id] })), [setEnabled]);
  const setMany = useCallback(
    (list: readonly string[], value: boolean) =>
      setEnabled((current) => ({ ...current, ...Object.fromEntries(list.map((id) => [id, value])) })),
    [setEnabled],
  );
  return { enabled, toggle, setMany };
}
