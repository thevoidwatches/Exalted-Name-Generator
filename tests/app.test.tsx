import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App, WeightsDialog } from '@/components';
import { CATEGORIES, CHIP_GROUPS, WORDS } from '@/data';
import { PATTERNS, defaultWeights, optionKeys } from '@/functions';

// Rendering to HTML catches crashes and missing pieces without needing a browser.
describe('the page', () => {
  const html = renderToStaticMarkup(<App />);

  const escaped = (text: string) => text.replace(/'/g, '&#x27;');

  it('shows every pattern and source chip', () => {
    for (const pattern of PATTERNS) expect(html).toContain(escaped(pattern.example));
    for (const category of CATEGORIES.filter((c) => CHIP_GROUPS.includes(c.group))) expect(html).toContain(`>${category.label}<`);
  });

  it('starts with a batch of ten names', () => {
    expect(html.match(/class="name"/g)?.length).toBe(10);
  });

  it('reports every pattern as active', () => {
    expect(html).toContain(`${PATTERNS.length} of ${PATTERNS.length} patterns active`);
  });

  it('shows optional parts in brackets, with a menu button for every pattern that has them', () => {
    expect(html).toContain('[Number] [Modifier] Noun [Gerund/Adjective/Verb]');
    expect(html.match(/class="chip-more"/g)?.length).toBe(PATTERNS.filter((p) => p.options?.length).length);
  });
});

describe('the Weights panel', () => {
  const weights = defaultWeights(PATTERNS, CATEGORIES);
  const render = (rarityMode: 'tier' | 'word') =>
    renderToStaticMarkup(
      <WeightsDialog
        open
        onClose={() => {}}
        patterns={PATTERNS}
        categories={CATEGORIES}
        words={WORDS}
        weights={weights}
        enabled={{}}
        rarityMode={rarityMode}
        onRarityModeChange={() => {}}
        onWeightChange={() => {}}
        onResetSection={() => {}}
        onResetAll={() => {}}
      />,
    );

  it('has a bar for every pattern, every optional part, every weighted source and every tier', () => {
    const bars = render('tier').match(/class="wbar"/g)?.length;
    const weighted = CATEGORIES.filter((c) => c.weight !== undefined).length;
    expect(bars).toBe(PATTERNS.length + optionKeys(PATTERNS).length + weighted + 3);
  });

  it('shows the per-list split only in per-word mode', () => {
    expect(render('tier')).not.toContain('class="splits"');
    expect(render('word')).toContain('class="splits"');
  });
});
