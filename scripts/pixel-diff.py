"""Pixel Perfect (lessons 141, 147): the mockup, the code and their difference side by side.

Usage: python3 scripts/pixel-diff.py <mockup.png> <code.png> <out.png>
Prints the share of pixels that differ more than a small tolerance.
"""

import sys

from PIL import Image, ImageChops

TOLERANCE = 24


def main(mockup_path: str, code_path: str, out_path: str) -> None:
    mockup = Image.open(mockup_path).convert('RGB')
    code = Image.open(code_path).convert('RGB').resize(mockup.size)
    diff = ImageChops.difference(mockup, code).convert('L')
    mask = diff.point(lambda value: 255 if value > TOLERANCE else 0)
    red = Image.new('RGB', mockup.size, (220, 38, 38))
    overlay = Image.composite(red, Image.blend(mockup, code, 0.5), mask)
    width, height = mockup.size
    sheet = Image.new('RGB', (width * 3 + 20, height), 'white')
    for index, part in enumerate((mockup, code, overlay)):
        sheet.paste(part, (index * (width + 10), 0))
    sheet.save(out_path)
    share = sum(1 for value in mask.get_flattened_data() if value) / (width * height)
    print(f'{out_path}: {share:.1%} differ')


if __name__ == '__main__':
    main(*sys.argv[1:4])
