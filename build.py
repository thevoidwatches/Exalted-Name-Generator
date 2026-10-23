"""Rebuild index.html from template.html and the word lists in src/.

Run:  python build.py
Each src/*.txt file becomes one word list, keyed by its filename.
Blank lines and lines starting with # are ignored; duplicate words within a file are dropped.
"""
import json
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"
TEMPLATE = ROOT / "template.html"
OUT = ROOT / "index.html"

# Section headers set a draw weight for every word that follows, until the next header:
#   # common   -> x2      # rare -> x0.5      # normal -> x1      # weight 0.3 -> any multiplier
# Any other line starting with # is a plain comment.
TIERS = {"common": 2.0, "rare": 0.5, "normal": 1.0}

lists, weights = {}, {}
for path in sorted(SRC.glob("*.txt")):
    seen, words, wts, tier = set(), [], [], 1.0
    for line in path.read_text(encoding="utf-8").splitlines():
        word = line.strip()
        if not word:
            continue
        if word.startswith("#"):
            key = word.lstrip("#").strip().lower()
            if key in TIERS:
                tier = TIERS[key]
            elif key.startswith("weight"):
                try:
                    tier = float(key.split()[1])
                except (IndexError, ValueError):
                    raise SystemExit(f"{path.name}: bad weight header '{word}'")
            continue
        if word.lower() not in seen:
            seen.add(word.lower())
            words.append(word)
            wts.append(tier)
    lists[path.stem] = words
    if any(w != 1.0 for w in wts):
        weights[path.stem] = wts

html = TEMPLATE.read_text(encoding="utf-8")
marker = "/*__WORDLISTS__*/"
if marker not in html:
    raise SystemExit(f"Marker {marker} not found in {TEMPLATE}")
html = html.replace(marker, json.dumps({"lists": lists, "weights": weights}, ensure_ascii=False))
OUT.write_text(html, encoding="utf-8")

def summary(k):
    n = len(lists[k])
    if k not in weights:
        return f"{k} ({n})"
    rare = sum(1 for w in weights[k] if w < 1); common = sum(1 for w in weights[k] if w > 1)
    return f"{k} ({n}, {common} common, {rare} rare)"
print(f"Wrote {OUT.name}: " + ", ".join(summary(k) for k in lists))
