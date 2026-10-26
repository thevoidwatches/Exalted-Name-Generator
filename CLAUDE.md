# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A random NPC name generator in the style of Exalted ("Harmonious Jade", "Seventh Crane", "Two Dogs Pursuing"). It's a React 19 + TypeScript + Vite single-page app with no backend, hosted on GitHub Pages at https://thevoidwatches.github.io/Exalted-Name-Generator/. The owner GMs an Exalted campaign and uses the hosted site to pre-generate names for everyday NPCs (merchants, guards, farmers). When suggesting words or patterns, favour plausible village names over grand Exalt names. Grandeur is handled by giving grand patterns and rare-tier words low weights.

## Commands

Requires Node 22. There is no linter or formatter configured.

```
npm run dev                                  # Vite dev server
npm test                                     # vitest run (all tests)
npx vitest run tests/csv.test.ts             # one file
npx vitest run tests/csv.test.ts -t "parseCsv"   # tests whose name matches
npm run typecheck                            # tsc -b (src and tests, strict, noUnusedLocals/Parameters)
npm run build                                # tsc -b && vite build -> dist/
```

## Deployment

Every push to `main` runs `.github/workflows/pages.yml`: `npm ci`, `npm test`, `npm run build`, then it deploys `dist/`. A failing test blocks the deploy and the live site keeps its last good version. The tests are the guard for CSV edits made in the GitHub web editor, so keep them passing and keep their error messages specific (file and line). The Vite `base` must stay `/Exalted-Name-Generator/`, and the case matters. Commit or push only when asked.

## Import and file conventions

- Import through the `@/` alias and the folder barrels (`import { Chip } from '@/components'`), never through relative paths. Only the `index.ts` barrels use relative re-exports.
- Modules import their siblings through their own barrel (for example `generator.ts` imports from `@/functions`), so **barrel export order matters**. Leaf modules go first. In `src/data/index.ts`, `categories` must come before `words`, because `words.ts` reads `CATEGORIES` while it loads. Two modules that import each other must not both go through the barrel.
- One component per file, in `src/components/{layout,controls,results,weights}`. Plain functions go in `src/functions`, hooks in `src/hooks`, shared types in `src/types`.
- Styling is one global stylesheet (`src/styles/global.css`), with no CSS modules. Values shared between CSS and components live in `src/styles/constants.ts`. At startup, `injectTheme()` turns `PALETTE` and `FONTS` into `:root` CSS variables, converting camelCase keys to kebab-case (`goldSoft` becomes `--gold-soft`). To add a theme colour, add it to both the light and dark palettes, then use the variable in CSS.
- Exported functions carry short JSDoc comments that explain intent, and the existing code is written in that style.

## Architecture

**Word data.** Six CSVs in `src/data/` (`modifiers`, `numbers`, `nouns`, `names`, `others`, `prepositions`) have the columns `word,plural,category,tier`. `others` holds verbs and adverbs. A verb's plural column is the form for a plural subject (Thunders, Thunder), and every verb needs one. Names (houses and personal names, for the Surname Forename pattern) and prepositions have no source chips; `CHIP_GROUPS` in `categories.ts` lists the groups that do. Short prepositions are lowercase ("of", "in", "to") and longer ones capitalised (Upon, With), following AP-style title case. `words.ts` imports them with `?raw`, so they're bundled at build time. It runs each through `parseWordTable`, which checks the header, the category and the tier, and throws errors that name the file and line. It builds `WORDS`, a `Record<Category, WordEntry[]>`, when the module loads. Each CSV may only contain the categories whose `group` maps to it. A blank plural means the word never fills a plural slot. A word may appear once per category, in several categories. By convention, rows are sorted by category then word, and numbers by numeric value.

**Categories** (`src/data/categories.ts`) define each source's chip label, tooltip, group, default weight and, for nouns, `slots`. The `Category` union in `src/types/words.ts` must match. Slots (`head`, `compound`, `ordinal`, `number`, `target`, `title`) limit where a noun category can appear. For example, epithets only fill `ordinal`, `number`, `target` and `title`, and nouns without a `slots` list get `DEFAULT_NOUN_SLOTS`.

**Patterns** (`src/functions/patterns.ts`) are the name templates. Each has a default `weight`, a list of `needs` (conditions that must hold under the current chips), and a `build(helpers, has)` that returns `Part[]`. Adding a new `Need` means updating the `Need` type, plus `needMet` and `NEED_LABELS` in `needs.ts`.

**Optional parts** (`src/functions/options.ts`) are the bracketed pieces of a pattern. Each is listed in `options` with a default `chance` (a percentage) and its own `needs`, and is written `{id}` in the label (`{a/b}` for two that share a position). `patternLabel` turns that into `[Label]`, dropping parts that can't currently appear. Each part can be switched on and off from the chip's ▾ menu, and its chance is set in the Weights panel. Both are stored under the key `patternId.optionId`. For each name, `rollOptions` decides which parts are included, and `build` asks `has(id)`. A `rules` entry ties two parts to one roll:

- `atLeastOne`: every name has one or both. If the chances add up to under 100%, they're scaled up.
- `atMostOne`: no name has both. If the chances add up to over 100%, they're scaled down.

The "of" pattern and Noun Preposition Noun end the same way, through `nameEnd` in `patterns.ts`: [the] [Modifier] Noun [and Noun], where "the" only goes before a nature word, a place, or a modifier and noun. The `plural` part of [Ordinal] [Modifier] Noun only applies to the body parts in `PAIRED_BODY_PARTS` (in `patterns.ts`), and only after a modifier with no ordinal. A data test checks that each of them has a plural. An `atLeastOne` pair with nothing able to appear makes the pattern unavailable (`blockedRules`). `unavailableReason` in `generator.ts` puts that, or any missing needs, into words for the chip's tooltip.

**Helpers** (`src/functions/helpers.ts`): `createHelpers(ctx)` binds the word-drawing toolkit to a `GeneratorContext`, which holds the words, categories, enabled chips, weights and rarity mode. Patterns draw every word through it, so chips, slot rules, weights and rarity apply everywhere. When the preferred categories are unavailable, `noun(slot, {only, plural})` narrows through fallbacks: preferred categories in the slot, then any category in the slot, then any head noun, then any enabled noun. If plural isn't possible, it falls back to singular. With `orMaterial`, a singular noun may instead be a material, at a fixed weight of 14 among the noun sources (`MATERIAL_NOUN_WEIGHT`, also used after "of" in Title of Noun). That's how "Harmonious Jade" and "Lotus of Weeping Iron" are made. Patterns ask for it after a modifier that isn't itself a material, and in place of a nature word after "of" ("Storm of Amber", never with "the"). `pick(categories)` draws across groups by source weight, for slots that mix them, such as an ending that may be an adjective, gerund or verb. Literals such as "of" and prepositions have `base: null`, so they are skipped by de-duplication and not shown in the "form" line. A part's `joinBefore` replaces the space before it, which is how Noun[-]Noun hyphenates only its two nouns.

**Generator** (`src/functions/generator.ts`): `activePatterns` keeps the patterns that are enabled, weighted above zero, and not unavailable. `makeName` picks a pattern by weight and retries up to 12 times if the name would repeat a base word. It then hyphenates the whole name at the `style.hyphenate` chance (Shining-Omen-of-Falling-Stars), except for patterns marked `noHyphenStyle` (Surname Forename). `generateBatch` collects distinct names and may return fewer than requested.

**Rarity** (`src/functions/picking.ts`): tiers are `common`, `normal` and `rare`. In `tier` mode (the default), a tier is picked by `tierShares` (50/33/17) from the tiers the list actually has, then a word is picked uniformly within it. In `word` mode, each word is weighted by `wordMult` (2/1/0.5). `tierMass` computes the per-list split that the Weights panel shows in word mode.

**State** (`src/hooks`): weights (including part chances), rarity mode, kept names and every chip toggle (patterns, sources and optional parts, in one map) are saved to localStorage under the `STORAGE_KEYS` in `storage.ts`. `sanitizeWeights` and `useToggles` keep only known keys with valid values, so new ids get their defaults (weight, chance or "on"). `App.tsx` owns all state and passes it down as props.

**Changing a default doesn't reach a browser that has visited before.** `usePersistentState` saves the whole value on first load, so the stored weights hold every key, and an edited default in code is overridden by the stored copy. Only new ids pick up their defaults. To ship a new default for an existing pattern, either rename its id (which is why `nounEnding` replaced `nounGerund` when its weight went from 10 to 18) or reset the weights in the panel.

## Tests

- `data.test.ts` checks the CSV invariants: every category has words, there are no duplicates within a category, only nouns and verbs have plurals, every verb has one, every noun category allowed in the `number` slot has at least one plural, words have no stray spaces, and "of" is among the prepositions.
- `generator.test.ts` generates 400 names per pattern and checks slot rules, plurals and repeated words. A new pattern is covered automatically. An `examples` block checks that every chip example, the page-header examples, and one name of each newer shape can actually be generated. It narrows the word lists to each example's words and draws up to 20,000 names until the example appears, since some need several optional parts at once. The test `context()` turns whole-name hyphenation off unless a test asks for it. It also checks that every option appears exactly once in its label, that switched-off parts never appear, that parts at 100% always do, and how both rules split their pairs. Rarity and rule tests are statistical (20,000 to 30,000 draws).
- `app.test.tsx` renders with `react-dom/server`'s `renderToStaticMarkup`, with no DOM environment. It asserts on class names (`name`, `wbar`, `splits`, `chip-more`), on chip label text, and on the count of 10 initial names, so renaming those classes or changing `DEFAULT_BATCH_SIZE` means updating it.

## Other

`.notes/` is git-ignored scratch space for draft word lists. Only `.gitkeep` is committed.
