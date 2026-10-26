# Exalted-Style Name Generator

A random name generator for NPCs in the style of Exalted: Harmonious Jade, Seventh Crane, Lotus of Weeping Iron, Two Dogs Pursuing.

**Live site:** https://thevoidwatches.github.io/Exalted-Name-Generator/

## Using it

Click **Generate** for a batch, click a name to keep it, and **Copy all** to take the kept list away. Chips turn patterns and word sources on and off. Parts of a pattern in [brackets] are optional; the ▾ beside the chip switches each one on or off. The **Weights** button opens a panel for adjusting how often each pattern, source, optional part and rarity tier is drawn, and how often a whole name is hyphenated. Kept names, chip settings and weights are remembered in your browser.

## Editing the word lists

Every word lives in one of six CSV files in `src/data/`:

| File | Categories |
|---|---|
| `modifiers.csv` | adjective, color, material, gerund |
| `numbers.csv` | cardinal, ordinal |
| `nouns.csv` | animal, plant, nature, object, body part, person, concept, epithet, place |
| `names.csv` | house, personal name |
| `others.csv` | verb, adverb |
| `prepositions.csv` | preposition |

Each file has four columns: `word,plural,category,tier`.

- **plural** is used for nouns and verbs. For a noun, leave it blank for a word that should never appear in a plural slot, such as Blood or Wisdom. For a verb, it's the form used after a plural subject: Thunders, Thunder.
- **category** must be one of the categories that file allows.
- **tier** is `common`, `normal` or `rare`. Blank means normal.
- A word may appear in several categories, one row per category, each with its own tier.

Files are sorted by category, then by word; numbers are sorted by value. Order does not affect generation.

You can edit a CSV directly on GitHub. Pushing to `main` runs the tests and redeploys the site. If a row is malformed, the tests name the file and line, and the live site keeps its previous version.

## Developing locally

Requires Node 22.

```
npm install
npm run dev       # local server with live reload
npm test          # run the tests
npm run build     # typecheck and build into dist/
```

## Layout

| Path | Contents |
|---|---|
| `src/components/` | React components, grouped into `layout`, `controls`, `results` and `weights` |
| `src/data/` | The word CSVs and `categories.ts`, which holds category labels, tooltips, default weights and slot rules |
| `src/functions/` | Generation logic, including `patterns.ts` with every name pattern, plus CSV parsing, storage and theme helpers |
| `src/hooks/` | React hooks for persistent state, kept names, weights, chip toggles and messages |
| `src/styles/` | `global.css` and `constants.ts`, which holds the palette and fonts shared by the stylesheet and components |
| `src/types/` | Shared TypeScript types |
| `tests/` | Vitest tests for the parser, the word lists, the generator and the page |
| `.notes/` | Scratch space for draft lists; its contents are not committed |

Every folder under `src/` has an `index.ts` barrel. Import through the `@/` alias, as in `import { Chip } from '@/components'`, not through relative paths.

## How names are built

Each pattern is a sequence of slots filled from the word lists. Noun categories declare which slots they may fill, so abstract lists such as Epithets appear only after ordinals, numbers and "of", or as titles. Weights decide how often each pattern and source is drawn. The rarity mode decides whether tiers hold a fixed share of every list (per tier) or each word carries its tier's multiplier (per word).
