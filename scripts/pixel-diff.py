"""Pixel Perfect (lessons 141, 147, 160, 165, 167): the mockup, the code, the two laid over each other
at half strength and their difference side by side, with a red numbered box on every region that
differs, on all four parts.

Usage: python3 scripts/pixel-diff.py <mockup.png> <code.png> <out.png> [title] [--skip x0,y0,x1,y1 ...]
The code shot is scaled to the mockup size. A pixel differs when one of its channels differs by more
than TOLERANCE. Differing pixels are grown by GROW px and grouped into regions; a region with fewer than
MIN_AREA differing pixels is antialiasing, not a difference. The rounded corners of a phone are not
compared, nor a --skip box: the tiles of a map, which change with the map data (owner decision 08.10.2026,
docs/141); it is drawn blue on all four parts and the share counts only the compared pixels. Prints the share of differing pixels, then one line per region: number, box, pixels.
"""

import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

TOLERANCE = 40
GROW = 6
MIN_AREA = 12
CORNER = 40
GAP = 20
# The overlay: the mockup and the code at half strength each, a shift shows as a double line.
OVERLAY = 0.5
RED = (230, 30, 30)
BLUE = (40, 110, 230)
SKIP_LABEL = 'xarita'
BOX_WIDTH = 3
LABEL_SIZE = 22
LABEL_HEIGHT = 25
HEAD_SIZE = 28
HEAD_ROOM = 60
TITLE_ROOM = 40
BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'


Box = tuple[int, int, int, int]


def differing(mockup: Image.Image, code: Image.Image, skips: list[Box]) -> np.ndarray:
    """The pixels that differ, without the four rounded corners of the phone and the skipped boxes."""
    left = np.asarray(mockup).astype(int)
    right = np.asarray(code).astype(int)
    mask = np.abs(left - right).max(axis=2) > TOLERANCE
    height, width = mask.shape
    for top, side in [(0, 0), (0, width - CORNER), (height - CORNER, 0), (height - CORNER, width - CORNER)]:
        mask[top:top + CORNER, side:side + CORNER] = False
    for x0, y0, x1, y1 in skips:
        mask[y0:y1, x0:x1] = False
    return mask


def regions(mask: np.ndarray) -> list[tuple[int, int, int, int, int]]:
    """The regions of the difference, top to bottom and left to right: x0, y0, x1, y1, pixels."""
    labels, _ = ndimage.label(ndimage.binary_dilation(mask, iterations=GROW))
    found = []
    for index, (rows, cols) in enumerate(ndimage.find_objects(labels), start=1):
        real = int(mask[rows, cols][labels[rows, cols] == index].sum())
        if real >= MIN_AREA:
            found.append((cols.start, rows.start, cols.stop, rows.stop, real))
    return sorted(found, key=lambda box: (box[1] // GAP, box[0]))


def numbered(image: Image.Image, boxes: list[tuple[int, int, int, int, int]], skips: list[Box]) -> Image.Image:
    """A copy of the image with a red box and its number on every region, a blue one on every skipped box."""
    marked = image.copy()
    draw = ImageDraw.Draw(marked)
    font = ImageFont.truetype(BOLD, LABEL_SIZE)
    for x0, y0, x1, y1 in skips:
        draw.rectangle([x0, y0, x1, y1], outline=BLUE, width=BOX_WIDTH)
        draw.text((x0 + 4, y0 + 2), SKIP_LABEL, fill=BLUE, font=font)
    for number, (x0, y0, x1, y1, _) in enumerate(boxes, start=1):
        draw.rectangle([x0, y0, x1, y1], outline=RED, width=BOX_WIDTH)
        label = str(number)
        left, top = x0 + 2, max(0, y0 - LABEL_HEIGHT - 1)
        draw.rectangle([left - 2, top, left + draw.textlength(label, font=font) + 4, top + LABEL_HEIGHT], fill=RED)
        draw.text((left + 1, top), label, fill='white', font=font)
    return marked


def main(mockup_path: str, code_path: str, out_path: str, title: str = '', skips: tuple[Box, ...] = ()) -> None:
    mockup = Image.open(mockup_path).convert('RGB')
    code = Image.open(code_path).convert('RGB').resize(mockup.size)
    mask = differing(mockup, code, list(skips))
    width, height = mockup.size
    skipped = np.zeros((height, width), dtype=bool)
    for x0, y0, x1, y1 in skips:
        skipped[y0:y1, x0:x1] = True
    share = mask.sum() / (width * height - skipped.sum())
    boxes = regions(mask)
    overlay = Image.blend(mockup, code, OVERLAY)
    heat = np.asarray(overlay).copy()
    heat[mask] = RED
    parts = [
        ('Maket', mockup),
        ('Kod', code),
        ('Ustma-ust', overlay),
        (f'Farq {share:.1%}', Image.fromarray(heat.astype('uint8'))),
    ]
    top = HEAD_ROOM + (TITLE_ROOM if title else 0)
    sheet = Image.new('RGB', (width * len(parts) + GAP * (len(parts) - 1), height + top), 'white')
    draw = ImageDraw.Draw(sheet)
    head = ImageFont.truetype(BOLD, HEAD_SIZE)
    if title:
        draw.text((0, 4), title, fill='black', font=head)
    for index, (name, part) in enumerate(parts):
        sheet.paste(numbered(part, boxes, list(skips)), (index * (width + GAP), top))
        draw.text((index * (width + GAP), top - HEAD_ROOM + 16), name, fill='black', font=head)
    sheet.save(out_path)
    print(f'{out_path}: {share:.2%} differ, {len(boxes)} regions')
    for number, (x0, y0, x1, y1, real) in enumerate(boxes, start=1):
        print(f'  {number}: x {x0}..{x1}, y {y0}..{y1}, {real} px')


if __name__ == '__main__':
    words = sys.argv[1:]
    marks = [index for index, word in enumerate(words) if word == '--skip']
    boxes_skipped = tuple(tuple(int(n) for n in words[index + 1].split(',')) for index in marks)
    plain = [word for index, word in enumerate(words) if index not in marks and index - 1 not in marks]
    main(*plain[:4], skips=boxes_skipped)
