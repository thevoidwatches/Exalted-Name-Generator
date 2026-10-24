/*
 * Shared design constants. themeCss in @/functions turns PALETTE and FONTS into CSS variables on :root
 * (camelCase keys become kebab-case: goldSoft becomes --gold-soft), so global.css and any component
 * read the same values.
 *
 * Palette: celadon paper and ink, orichalcum gold as the single accent, jade green for the "kept" state.
 */

export const PALETTE = {
  light: {
    bg: '#eef1ea',
    panel: '#f7f8f3',
    fg: '#1f2a24',
    muted: '#5e6a62',
    line: '#cfd6cb',
    gold: '#a67c1e',
    goldSoft: '#e9dbb3',
    onGold: '#fff8e6',
    jade: '#3f7d5c',
    jadeSoft: '#d6e6dc',
    tierCommon: '#a67c1e',
    tierNormal: '#cfae63',
    tierRare: '#e8dcb8',
    backdrop: 'rgba(10, 16, 13, 0.5)',
    shadow: 'rgba(10, 16, 13, 0.16)',
  },
  dark: {
    bg: '#141a17',
    panel: '#1c2420',
    fg: '#e8e4d6',
    muted: '#9ea89f',
    line: '#33403a',
    gold: '#d4a640',
    goldSoft: '#3d3418',
    onGold: '#fff8e6',
    jade: '#6fb08a',
    jadeSoft: '#22352b',
    tierCommon: '#d4a640',
    tierNormal: '#8f7030',
    tierRare: '#4a3c1b',
    backdrop: 'rgba(10, 16, 13, 0.5)',
    shadow: 'rgba(0, 0, 0, 0.45)',
  },
} as const;

export const FONTS = {
  display: "'Marcellus', 'Palatino Linotype', 'Book Antiqua', Georgia, serif",
  body: "'Alegreya', Georgia, 'Times New Roman', serif",
  ui: "'Alegreya Sans', 'Segoe UI', Helvetica, Arial, sans-serif",
} as const;

/** Glyphs for a name's kept state. */
export const KEPT_MARK = { on: '◆', off: '◇' } as const;

/** How long a confirmation message stays under the kept-names list, in milliseconds. */
export const TOAST_MS = 2200;

/** Batch sizes offered next to the Generate button. */
export const BATCH_SIZES = [5, 10, 20, 50] as const;
export const DEFAULT_BATCH_SIZE = 10;
