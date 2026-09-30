"""The web font of the landing (docs/60): Rubik with the weights 300 to 900 in one small woff2.

Rubik has no ʻ (U+02BB, the Uzbek oʻ and gʻ): the font gets the glyph of ‘ (U+2018) for it,
the same way the pictures draw it (docs/36, lesson 8).

Run: pip install fonttools brotli; python3 brands/rida/brand-kit/tools/web-font.py
"""
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

KIT = Path(__file__).resolve().parent.parent
SOURCE = KIT / 'fonts' / 'rubik' / 'Rubik[wght].ttf'
TARGET = KIT.parent / 'landing' / 'fonts' / 'brand.woff2'
# Latin with the signs of the texts: ʼ ‘ ’ « » ≈ © · № and the no-break space of numbers.
TEXT = [*range(0x20, 0x7F), *range(0xA0, 0x100), 0x2BB, 0x2BC, 0x2018, 0x2019, 0x2248, 0x2116, 0x202F]

font = TTFont(SOURCE)
turned = font.getBestCmap()[0x2018]
for table in font['cmap'].tables:
    if table.isUnicode():
        table.cmap[0x2BB] = turned
options = subset.Options()
options.flavor = 'woff2'
options.layout_features = ['kern', 'liga']
subsetter = subset.Subsetter(options)
subsetter.populate(unicodes=TEXT)
subsetter.subset(font)
TARGET.parent.mkdir(parents=True, exist_ok=True)
font.save(TARGET)
print(f'{TARGET.name}: {TARGET.stat().st_size // 1024} KB')
