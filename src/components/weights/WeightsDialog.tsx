import { useEffect, useRef } from 'react';
import { OptionsSection, RaritySection, WeightChart } from '@/components';
import type { SplitRow } from '@/components';
import { CHIP_GROUPS } from '@/data';
import { patternLabel } from '@/functions';
import type { WeightGroup } from '@/hooks';
import type { CategoryInfo, Pattern, RarityMode, WeightConfig, WeightSection, WordIndex } from '@/types';

interface WeightsDialogProps {
  open: boolean;
  onClose: () => void;
  patterns: Pattern[];
  categories: CategoryInfo[];
  words: WordIndex;
  weights: WeightConfig;
  /** Chip and optional-part toggles, so the panel can mark parts that are switched off. */
  enabled: Record<string, boolean>;
  rarityMode: RarityMode;
  onRarityModeChange: (mode: RarityMode) => void;
  onWeightChange: (group: WeightGroup, id: string, value: number) => void;
  onResetSection: (section: WeightSection) => void;
  onResetAll: () => void;
}

/** The Weights panel: one bar chart per set of weights, plus the rarity settings. */
export function WeightsDialog({
  open,
  onClose,
  patterns,
  categories,
  words,
  weights,
  enabled,
  rarityMode,
  onRarityModeChange,
  onWeightChange,
  onResetSection,
  onResetAll,
}: WeightsDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const sourceRows = (group: 'modifier' | 'noun') =>
    categories
      .filter((c) => c.group === group)
      .map((c) => ({
        id: c.id,
        label: c.label,
        note: `${words[c.id].length} words`,
        value: weights.categories[c.id] ?? 0,
      }));

  const splitRows: SplitRow[] = categories
    .filter((c) => CHIP_GROUPS.includes(c.group))
    .map((c) => ({ id: c.id, label: c.label, entries: words[c.id] }));

  return (
    <dialog
      ref={dialog}
      className="modal"
      aria-labelledby="weights-title"
      onClose={onClose}
      // A click on the backdrop lands on the dialog element itself, since the form fills it.
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
    >
      {open && (
        <form method="dialog" className="modal-inner">
          <h2 id="weights-title">Weights</h2>
          <p className="hint">
            Higher numbers draw more often; zero never draws. Only the ratio between numbers matters. Changes apply to
            the next batch and are remembered in this browser.
          </p>
          <div className="wgrid">
            <WeightChart
              title="Patterns"
              rows={patterns.map((p) => ({ id: p.id, label: patternLabel(p), value: weights.patterns[p.id] ?? 0 }))}
              onChange={(id, value) => onWeightChange('patterns', id, value)}
              onReset={() => onResetSection('patterns')}
            />
            <div className="wstack">
              <WeightChart
                title="Modifier sources"
                rows={sourceRows('modifier')}
                onChange={(id, value) => onWeightChange('categories', id, value)}
                onReset={() => onResetSection('modifiers')}
              />
              <WeightChart
                title="Noun sources"
                rows={sourceRows('noun')}
                onChange={(id, value) => onWeightChange('categories', id, value)}
                onReset={() => onResetSection('nouns')}
              />
            </div>
            <OptionsSection
              patterns={patterns}
              weights={weights}
              enabled={enabled}
              onChange={(key, value) => onWeightChange('options', key, value)}
              onReset={() => onResetSection('options')}
            />
            <RaritySection
              mode={rarityMode}
              weights={weights}
              splitRows={splitRows}
              onModeChange={onRarityModeChange}
              onChange={(group, tier, value) => onWeightChange(group, tier, value)}
              onReset={() => onResetSection('rarity')}
            />
          </div>
          <div className="actions">
            <button type="button" className="btn quiet" onClick={onResetAll}>
              Reset to defaults
            </button>
            <button type="submit" className="btn">
              Done
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}
