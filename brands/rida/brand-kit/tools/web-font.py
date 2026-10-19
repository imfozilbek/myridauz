"""The web font of the brand (G73, owner decision 07.10.2026): DejaVu Sans, the font of the mockups.

Regular and bold, each in a Latin and a Cyrillic file: a page loads the Cyrillic one only when it
shows a Cyrillic word. No hinting: phones draw without it, and the files are four times smaller.
font.css holds the faces; font-display block, so no word flashes in the font of the phone (G41).
The Mini Apps get the folder from public/ (Cloudflare Pages), the landing copies it (docs/59).

Run: apt install fonts-dejavu-core; pip install fonttools brotli
     python3 brands/rida/brand-kit/tools/web-font.py
"""
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

SOURCE = Path('/usr/share/fonts/truetype/dejavu')
FONT = 'dejavu-sans'
TARGET = Path(__file__).resolve().parents[2] / 'public' / 'fonts' / FONT
WEIGHTS = {'regular': ('DejaVuSans.ttf', '100 500'), 'bold': ('DejaVuSans-Bold.ttf', '600 900')}
# Latin with the signs of the texts (docs/25): oʻ gʻ ʼ, quotes, dashes, № ≈ − → ★ ✓ and the no-break
# space of numbers. The pictures (✅ ⭐ ⚠) stay with the emoji of the phone.
SCRIPTS = {
    'latin': 'U+0020-007E,U+00A0-017F,U+0218-021B,U+02BB-02BC,U+2000-200C,U+2010-2027,U+202F-2044,'
    'U+20AC,U+2116,U+2122,U+2190-2195,U+2212,U+2248,U+2605,U+2713',
    'cyrillic': 'U+0400-052F',
}


def codes(ranges):
    for part in ranges.split(','):
        first, _, last = part[2:].partition('-')
        yield from range(int(first, 16), int(last or first, 16) + 1)


def build(source, ranges, target):
    font = TTFont(SOURCE / source)
    options = subset.Options()
    options.flavor = 'woff2'
    options.hinting = False
    options.layout_features = ['kern', 'liga']
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=list(codes(ranges)))
    subsetter.subset(font)
    subset.save_font(font, target, options)
    print(f'{target.name}: {target.stat().st_size // 1024} KB')


def face(name, weight, ranges):
    return (
        f'@font-face{{font-family:"{FONT}";src:url(/fonts/{FONT}/{name}.woff2) format("woff2");'
        f'font-weight:{weight};font-display:block;unicode-range:{ranges}}}\n'
    )


TARGET.mkdir(parents=True, exist_ok=True)
faces = ''
for weight, (source, range_of_weights) in WEIGHTS.items():
    for script, ranges in SCRIPTS.items():
        name = f'{weight}-{script}'
        build(source, ranges, TARGET / f'{name}.woff2')
        faces += face(name, range_of_weights, ranges)
(TARGET / 'font.css').write_text(faces)
