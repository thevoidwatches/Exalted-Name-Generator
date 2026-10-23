import { useCallback, useMemo } from 'react';
import { CATEGORIES } from '@/data';
import { PATTERNS, STORAGE_KEYS, defaultWeights, resetWeightSection, sanitizeWeights } from '@/functions';
import { usePersistentState } from '@/hooks';
import type { RarityMode, WeightConfig, WeightSection } from '@/types';

/** Group names inside WeightConfig that hold editable numbers. */
export type WeightGroup = keyof WeightConfig;

/** Every adjustable weight and the rarity mode, remembered in this browser. */
export function useWeights() {
  const defaults = useMemo(() => defaultWeights(PATTERNS, CATEGORIES), []);
  const [weights, setWeights] = usePersistentState<WeightConfig>(STORAGE_KEYS.weights, defaults, (raw) =>
    sanitizeWeights(raw, defaults),
  );
  const [rarityMode, setRarityMode] = usePersistentState<RarityMode>(STORAGE_KEYS.rarityMode, 'tier', (raw) =>
    raw === 'word' ? 'word' : 'tier',
  );

  const setWeight = useCallback(
    (group: WeightGroup, id: string, value: number) =>
      setWeights((current) => ({ ...current, [group]: { ...current[group], [id]: value } })),
    [setWeights],
  );
  const resetSection = useCallback(
    (section: WeightSection) => setWeights((current) => resetWeightSection(current, defaults, section, CATEGORIES)),
    [setWeights, defaults],
  );
  const resetAll = useCallback(() => setWeights(defaults), [setWeights, defaults]);

  return { weights, defaults, setWeight, resetSection, resetAll, rarityMode, setRarityMode };
}
