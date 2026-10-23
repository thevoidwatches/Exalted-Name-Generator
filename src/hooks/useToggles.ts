import { useCallback, useState } from 'react';

/** On/off state for a set of chips, all on to start. Not remembered between visits. */
export function useToggles(ids: readonly string[]) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ids.map((id) => [id, true])),
  );
  const toggle = useCallback((id: string) => setEnabled((current) => ({ ...current, [id]: !current[id] })), []);
  const setMany = useCallback(
    (list: readonly string[], value: boolean) =>
      setEnabled((current) => ({ ...current, ...Object.fromEntries(list.map((id) => [id, value])) })),
    [],
  );
  return { enabled, toggle, setMany };
}
