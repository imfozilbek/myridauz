# The map of the 14 regions for «Qaysi viloyatdansiz?» of the waitlist (G83, docs/181): an own SVG
# from the district borders of the directory (docs/48), no map library and no tiles. The values of
# the approved mockup (docs/goals/g83/approved, 5-regions): a box of 324 × 196, the districts of a
# region drawn as one area, the names of the 5 groups, the center of each region, Toshkent shahri.
# Run by hand when the borders change: python3 scripts/region-map.py
# Writes packages/ui/src/waitlist/region-map.json.
import json
import math

ROOT = __file__.rsplit('/scripts/', 1)[0]
SOURCE = f'{ROOT}/apps/backend/seed/district-borders.json'
TARGET = f'{ROOT}/packages/ui/src/waitlist/region-map.json'
WIDTH, HEIGHT = 324, 196
PRECISION = 1e4
# A long border keeps every 8th point, a middle one every 2nd: the same picture, a small file.
LONG, MIDDLE = 80, 20
# Where the name of each group stands (the approved mockup).
GROUPS = {'tashkent': (70.35, 41.95), 'valley': (71.75, 40.62), 'center': (64.6, 41.5),
          'south': (66.6, 38.35), 'west': (59.2, 42.9)}
# The name of a chosen region where its center is no good place for it.
SPOTS = {'1718': (66.5, 39.55), '1730': (71.4, 40.25), '1726': (69.6, 42.75)}
CITY = (69.29, 41.31)


def decode(line):
    ring, index, lat, lng = [], 0, 0, 0

    def next_value():
        nonlocal index
        result, shift, byte = 0, 0, 0x20
        while byte >= 0x20:
            byte = ord(line[index]) - 63
            index += 1
            result |= (byte & 0x1f) << shift
            shift += 5
        return ~(result >> 1) if result & 1 else result >> 1

    while index < len(line):
        lat += next_value()
        lng += next_value()
        ring.append((lng / PRECISION, lat / PRECISION))
    return ring


def thin(ring):
    return ring[::8] if len(ring) > LONG else ring[::2] if len(ring) > MIDDLE else ring


places = json.load(open(SOURCE))['places']
rings = {}
for place, parts in places.items():
    for part in parts:
        rings.setdefault(place[:4], []).append(thin(decode(part[0])))
points = [point for region in rings.values() for ring in region for point in ring]
west, east = min(p[0] for p in points), max(p[0] for p in points)
south, north = min(p[1] for p in points), max(p[1] for p in points)
k = math.cos(math.radians((south + north) / 2))
scale = min(WIDTH / ((east - west) * k), HEIGHT / (north - south))
ox, oy = (WIDTH - (east - west) * k * scale) / 2, (HEIGHT - (north - south) * scale) / 2


def xy(point):
    return [round((point[0] - west) * k * scale + ox, 1), round((north - point[1]) * scale + oy, 1)]


def shape(region):
    out = ''
    for ring in region:
        pixels = []
        for point in ring:
            pixel = tuple(round(value) for value in xy(point))
            if not pixels or pixel != pixels[-1]:
                pixels.append(pixel)
        if len(pixels) > 2:
            out += 'M' + 'L'.join(f'{x},{y}' for x, y in pixels) + 'Z'
    return out


def center(region):
    flat = [point for ring in rings[region] for point in ring]
    return (sum(p[0] for p in flat) / len(flat), sum(p[1] for p in flat) / len(flat))


data = {
    'width': WIDTH,
    'height': HEIGHT,
    'regions': {region: shape(rings[region]) for region in sorted(rings)},
    'centers': {region: xy(center(region)) for region in sorted(rings)},
    'spots': {region: xy(SPOTS.get(region, center(region))) for region in sorted(rings)},
    'groups': {group: xy(spot) for group, spot in GROUPS.items()},
    'city': xy(CITY),
}
# One line a region: a short file, each region can be read on its own line.
lines = [f'  "{key}": {json.dumps(value, separators=(",", ":"))}' for key, value in data.items() if key != 'regions']
regions = [f'    "{region}": {json.dumps(d)}' for region, d in data['regions'].items()]
with open(TARGET, 'w') as out:
    out.write('{\n  "regions": {\n' + ',\n'.join(regions) + '\n  },\n' + ',\n'.join(lines) + '\n}\n')
print(f'region-map: {len(data["regions"])} regions, {sum(len(d) for d in data["regions"].values())} signs')
