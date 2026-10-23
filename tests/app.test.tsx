import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App, WeightsDialog } from '@/components';
import { CATEGORIES, WORDS } from '@/data';
import { PATTERNS, defaultWeights } from '@/functions';

// Rendering to HTML catches crashes and missing pieces without needing a browser.
describe('the page', () => {
  const html = renderToStaticMarkup(<App />);

  const escaped = (text: string) => text.replace(/'/g, '&#x27;');

  it('shows every pattern and source chip', () => {
    for (const pattern of PATTERNS) expect(html).toContain(escaped(pattern.example));
    for (const category of CATEGORIES.filter((c) => c.group !== 'preposition')) expect(html).toContain(`>${category.label}<`);
  });

  it('starts with a batch of ten names', () => {
    expect(html.match(/class="name"/g)?.length).toBe(10);
  });

  it('reports every pattern as active', () => {
    expect(html).toContain(`${PATTERNS.length} of ${PATTERNS.length} patterns active`);
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
        rarityMode={rarityMode}
        onRarityModeChange={() => {}}
        onWeightChange={() => {}}
        onResetSection={() => {}}
        onResetAll={() => {}}
      />,
    );

  it('has a bar for every pattern, every weighted source and every tier', () => {
    const bars = render('tier').match(/class="wbar"/g)?.length;
    const weighted = CATEGORIES.filter((c) => c.weight !== undefined).length;
    expect(bars).toBe(PATTERNS.length + weighted + 3);
  });

  it('shows the per-list split only in per-word mode', () => {
    expect(render('tier')).not.toContain('class="splits"');
    expect(render('word')).toContain('class="splits"');
  });
});
