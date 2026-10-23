import { FONTS, PALETTE } from '@/styles';

const toCssName = (key: string) => '--' + key.replace(/[A-Z]/g, (letter) => '-' + letter.toLowerCase());

const declarations = (values: Record<string, string>) =>
  Object.entries(values)
    .map(([key, value]) => `  ${toCssName(key)}: ${value};`)
    .join('\n');

/** The :root variable blocks for both colour schemes, built from the style constants. */
export function themeCss(): string {
  return [
    `:root {\n${declarations(PALETTE.light)}\n${declarations(FONTS)}\n  color-scheme: light;\n}`,
    `@media (prefers-color-scheme: dark) {\n:root {\n${declarations(PALETTE.dark)}\n  color-scheme: dark;\n}\n}`,
  ].join('\n');
}

/** Adds the theme variables to the page head, ahead of every other stylesheet. */
export function injectTheme(doc: Document = document): void {
  const existing = doc.getElementById('theme-variables');
  const style = existing ?? doc.createElement('style');
  style.id = 'theme-variables';
  style.textContent = themeCss();
  if (!existing) doc.head.prepend(style);
}
