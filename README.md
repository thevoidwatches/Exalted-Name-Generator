# Exalted-Style Name Generator

A single-page random name generator for NPCs in the style of Exalted: Harmonious Jade, Seventh Crane, Lotus of Weeping Iron, Two Dogs Pursuing.

## Using it

Open `index.html` in a browser. Click **Generate** for a batch, click a name to keep it, and **Copy all** to take the kept list away. Chips turn patterns and word sources on and off; the **Weights** button opens a panel for adjusting how often each pattern, source, and rarity tier is drawn.

## Editing the word lists

Everything the generator draws from lives in `src/`, one plain text file per list, one word per line.

- Lines starting with `#` are comments, except the tier headers below.
- `# common`, `# normal`, and `# rare` set the rarity tier for every word that follows. Common words draw more often, rare words less. A file with no headers is all normal.
- Duplicate words within a file are dropped at build time.
- `cardinals.txt` and `ordinals.txt` are kept in numeric order within each tier; every other list is alphabetical within each tier.

`index.html` is generated. After editing `template.html` or anything in `src/`, rebuild it:

```
python build.py
```

The script embeds every list into the page so the result is one self-contained file. The build summary prints the word and tier counts per list.

## Files

| Path | Purpose |
|---|---|
| `template.html` | The page: styles, markup, and generator code, with a placeholder for the word lists |
| `build.py` | Reads `src/*.txt`, injects the lists, writes `index.html` |
| `index.html` | Generated output; open or publish this |
| `src/` | Word lists, one per category |
| `.notes/` | Scratch space for draft lists before folding them into `src/` |

## How names are built

Each pattern is a sequence of slots filled from the word lists. Noun lists declare which slots they may fill, so abstract lists such as Epithets appear only after ordinals, numbers, "of", and as titles. Weights decide how often each pattern and source is drawn, and the rarity mode decides whether tiers are honored per word or per tier. All of that is adjustable from the Weights panel and saved in the browser.
