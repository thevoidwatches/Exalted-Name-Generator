import { useMemo, useState } from 'react';
import {
  GenerateBar,
  KeptNames,
  PageHeader,
  PatternPicker,
  ResultsList,
  SourcePicker,
  WeightsDialog,
} from '@/components';
import { CATEGORIES, CHIP_GROUPS, WORDS } from '@/data';
import { PATTERNS, STORAGE_KEYS, availabilityHint, copyText, generateBatch, optionKeys } from '@/functions';
import { useKeptNames, useToast, useToggles, useWeights } from '@/hooks';
import { DEFAULT_BATCH_SIZE } from '@/styles';
import type { CategoryGroup, GeneratedName, GeneratorContext } from '@/types';

const PATTERN_IDS = PATTERNS.map((p) => p.id);
const CHIP_IDS = [
  ...PATTERN_IDS,
  ...optionKeys(PATTERNS),
  ...CATEGORIES.filter((c) => CHIP_GROUPS.includes(c.group)).map((c) => c.id),
];
const categoriesIn = (group: CategoryGroup) => CATEGORIES.filter((c) => c.group === group);

/** The whole page: controls and results on the left, kept names on the right, and the Weights panel. */
export function App() {
  const { weights, setWeight, resetSection, resetAll, rarityMode, setRarityMode } = useWeights();
  const { enabled, toggle, setMany } = useToggles(STORAGE_KEYS.chips, CHIP_IDS);
  const kept = useKeptNames();
  const toast = useToast();
  const [count, setCount] = useState<number>(DEFAULT_BATCH_SIZE);
  const [weightsOpen, setWeightsOpen] = useState(false);

  const ctx: GeneratorContext = useMemo(
    () => ({ words: WORDS, categories: CATEGORIES, enabled, weights, rarityMode }),
    [enabled, weights, rarityMode],
  );
  const [results, setResults] = useState<GeneratedName[]>(() => generateBatch(DEFAULT_BATCH_SIZE, ctx));

  const copyAll = async () => {
    if (!kept.names.length) {
      toast.show('Nothing to copy yet.');
      return;
    }
    const copied = await copyText(kept.names.join('\n'));
    toast.show(copied ? `Copied ${kept.names.length} names.` : 'Select the list and copy it by hand.');
  };

  return (
    <div className="wrap">
      <PageHeader />
      <div className="grid">
        <section>
          <div className="controls">
            <PatternPicker
              patterns={PATTERNS}
              ctx={ctx}
              onToggle={toggle}
              onSetAll={(on) => setMany(PATTERN_IDS, on)}
            />
            <SourcePicker label="Modifier sources" categories={categoriesIn('modifier')} enabled={enabled} onToggle={toggle} />
            <SourcePicker label="Number sources" categories={categoriesIn('number')} enabled={enabled} onToggle={toggle} />
            <SourcePicker label="Noun sources" categories={categoriesIn('noun')} enabled={enabled} onToggle={toggle} />
            <SourcePicker label="Other sources" categories={categoriesIn('other')} enabled={enabled} onToggle={toggle} />
            <GenerateBar
              count={count}
              hint={availabilityHint(ctx)}
              onCountChange={setCount}
              onGenerate={() => setResults(generateBatch(count, ctx))}
              onOpenWeights={() => setWeightsOpen(true)}
            />
          </div>
          <ResultsList names={results} isKept={kept.isKept} onToggleKept={kept.toggle} />
        </section>
        <KeptNames
          names={kept.names}
          message={toast.message}
          onRemove={kept.toggle}
          onCopy={copyAll}
          onClear={() => {
            kept.clear();
            toast.show('Cleared.');
          }}
        />
      </div>
      <WeightsDialog
        open={weightsOpen}
        onClose={() => setWeightsOpen(false)}
        patterns={PATTERNS}
        categories={CATEGORIES}
        words={WORDS}
        weights={weights}
        enabled={enabled}
        rarityMode={rarityMode}
        onRarityModeChange={setRarityMode}
        onWeightChange={setWeight}
        onResetSection={resetSection}
        onResetAll={resetAll}
      />
    </div>
  );
}
