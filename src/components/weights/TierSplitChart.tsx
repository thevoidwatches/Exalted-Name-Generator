import { TIER_LABELS, TIER_ORDER, tierMass } from '@/functions';
import type { Tier, WordEntry } from '@/types';

export interface SplitRow {
  id: string;
  label: string;
  entries: WordEntry[];
}

interface TierSplitChartProps {
  rows: SplitRow[];
  wordMult: Record<Tier, number>;
}

/** For per-word rarity: one stacked bar per list showing how its draws split across the tiers. */
export function TierSplitChart({ rows, wordMult }: TierSplitChartProps) {
  return (
    <div className="splits">
      <div className="legend">
        {TIER_ORDER.map((tier) => (
          <span key={tier}>
            <i className={`swatch tier-${tier}`} />
            {TIER_LABELS[tier]}
          </span>
        ))}
      </div>
      {rows.map((row) => {
        const mass = tierMass(row.entries, wordMult);
        const pct = (tier: Tier) => Math.round(100 * mass[tier]);
        const summary = TIER_ORDER.map((tier) => `${TIER_LABELS[tier].toLowerCase()} ${pct(tier)}%`).join(', ');
        return (
          <div className="split" key={row.id}>
            <span>{row.label}</span>
            <div className="stack" title={`${row.label}: ${summary}`}>
              {TIER_ORDER.filter((tier) => mass[tier] > 0).map((tier) => (
                <i key={tier} className={`tier-${tier}`} style={{ width: `${(100 * mass[tier]).toFixed(1)}%` }} />
              ))}
            </div>
            <span className="pct">{TIER_ORDER.map(pct).join(' / ')}</span>
          </div>
        );
      })}
    </div>
  );
}
