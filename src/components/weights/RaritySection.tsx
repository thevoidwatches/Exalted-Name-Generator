import { Chip, TierSplitChart, WeightChart } from '@/components';
import type { SplitRow } from '@/components';
import { TIER_LABELS, TIER_ORDER } from '@/functions';
import type { RarityMode, Tier, WeightConfig } from '@/types';

interface RaritySectionProps {
  mode: RarityMode;
  weights: WeightConfig;
  splitRows: SplitRow[];
  onModeChange: (mode: RarityMode) => void;
  onChange: (group: 'wordMult' | 'tierShares', tier: Tier, value: number) => void;
  onReset: () => void;
}

const MODES: Array<{ id: RarityMode; label: string; tip: string }> = [
  { id: 'tier', label: 'Per tier', tip: 'Common words stay common and rare words stay rare, in every list.' },
  {
    id: 'word',
    label: 'Per word',
    tip: 'Each word has a fixed chance against its neighbours; a tier as a whole may still dominate a list.',
  },
];

const EXPLANATIONS: Record<RarityMode, string> = {
  tier: 'Keeps common words common and rare words rare: these shares say how much of every list’s output comes from each tier, however many words the tier holds. Within a tier every word is equally likely, so the words of a small tier repeat more often than those of a big one.',
  word: 'Keeps any one word from being too common or too rare: each word draws by its tier’s multiplier, so with the defaults a common word shows up twice as often as a normal one and a rare word half as often, whatever list it is in. The tier as a whole is not controlled, so in a list with many rare words you will still meet rare words often. The split below shows what each list actually produces.',
};

/** The rarity mode switch and the numbers for whichever mode is chosen. */
export function RaritySection({ mode, weights, splitRows, onModeChange, onChange, onReset }: RaritySectionProps) {
  const switcher = (
    <span className="chips" role="radiogroup" aria-label="Word rarity mode">
      {MODES.map((m) => (
        <Chip
          key={m.id}
          role="radio"
          label={m.label}
          title={m.tip}
          pressed={mode === m.id}
          onClick={() => onModeChange(m.id)}
        />
      ))}
    </span>
  );

  const group = mode === 'word' ? 'wordMult' : 'tierShares';
  const rows = TIER_ORDER.map((tier) => ({
    id: `${group}-${tier}`,
    label: `${TIER_LABELS[tier]} ${mode === 'word' ? 'word' : 'tier'}`,
    value: weights[group][tier],
  }));

  return (
    <WeightChart
      title="Word rarity"
      tools={switcher}
      onReset={onReset}
      wide
      rows={rows}
      step={mode === 'word' ? 0.1 : 1}
      max={mode === 'word' ? 5 : 100}
      showPercent={mode === 'tier'}
      onChange={(id, value) => onChange(group, id.slice(group.length + 1) as Tier, value)}
      after={mode === 'word' && <TierSplitChart rows={splitRows} wordMult={weights.wordMult} />}
    >
      <p className="hint">{EXPLANATIONS[mode]}</p>
    </WeightChart>
  );
}
