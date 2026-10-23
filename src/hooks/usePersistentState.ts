import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { readStored, writeStored } from '@/functions';

/** React state that is loaded from and saved to browser storage under the given key. */
export function usePersistentState<T>(
  key: string,
  fallback: T,
  sanitize?: (raw: unknown) => T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => readStored(key, fallback, sanitize));
  useEffect(() => {
    writeStored(key, value);
  }, [key, value]);
  return [value, setValue];
}
