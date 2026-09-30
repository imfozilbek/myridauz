# The borders of every level 2 place of the directory (G24, docs/48): districts and cities.
# Source: OpenStreetMap (districts, admin_level 6), for cities without an own OSM border the
# OCHA ROCCA borders (CC BY 3.0 IGO). Smaller places are cut out of bigger ones: no overlaps.
# Run by hand when the directory or the borders change: python3 scripts/district-borders.py
# Needs shapely. Writes apps/backend/seed/district-borders.json (polylines, precision 1e-4).
import hashlib
import json
import os
import re
import time
import urllib.request

from shapely.geometry import Point, Polygon, shape
from shapely.ops import unary_union

ROOT = __file__.rsplit('/scripts/', 1)[0]
OSM_API = 'https://api.openstreetmap.org/api/0.6/relation/'
POLYGONS = 'https://polygons.openstreetmap.fr/'
SIMPLIFY = '0.000500-0.000100-0.000100'
OCHA = ('https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/main/releaseData/'
        'gbOpen/UZB/ADM2/geoBoundaries-UZB-ADM2_simplified.geojson')
UZBEKISTAN = 196240
# Districts and cities the regions do not list as subareas, found by name in Nominatim.
MISSING = [7591363, 7629494, 11183885, 11087239, 11087876, 5745823, 18507147, 11086479, 18507227]
# Cities with only a place area in OSM (a closed way), and a wrong OCHA border.
WAYS = {'Shirin shahri': 140375240}
# Places whose center lies in another border: their own OSM district (SOATO → OSM name).
FIXED = {'1710245': 'Shahrisabz tumani'}
# OSM districts the directory does not have: they are parts of these places (SOATO).
MERGED = {'Davlatobod tumani': '1714401', 'Yangi Namangan tumani': '1714401',
          'Yangi Toshkent Tumani': '1726264'}
PRECISION = 1e4
# A city center may lie a little outside its OCHA border (about 5 km at most).
NEAR = 0.05
# How far a gap looks for its neighbour, in degrees (about 100 m).
GAP_EDGE = 0.001


# BORDERS_CACHE=<dir>: answers are kept there, a second run does not download again.
def get(url):
    cache = os.environ.get('BORDERS_CACHE')
    path = cache and f'{cache}/{hashlib.sha1(url.encode()).hexdigest()}'
    if path and os.path.exists(path):
        return open(path, 'rb').read()
    body = download(url)
    if path:
        open(path, 'wb').write(body)
    return body


def download(url):
    for attempt in range(4):
        try:
            request = urllib.request.Request(url, headers={'User-Agent': 'district-borders/1.0'})
            return urllib.request.urlopen(request, timeout=120).read()
        except OSError:
            time.sleep(2 ** attempt)
    raise RuntimeError(url)


def relation(osm_id):
    xml = get(f'{OSM_API}{osm_id}').decode()
    tags = dict(re.findall(r'<tag k="([^"]+)" v="([^"]*)"', xml))
    return tags, re.findall(r'<member type="relation" ref="(\d+)" role="subarea"', xml)


def border(osm_id):
    get(f'{POLYGONS}index.py?id={osm_id}')
    return shape(json.loads(get(f'{POLYGONS}get_geojson.py?id={osm_id}&params={SIMPLIFY}')))


def way(osm_id):
    xml = get(f'{OSM_API.replace("relation", "way")}{osm_id}/full').decode()
    nodes = {i: (float(lng), float(lat)) for i, lat, lng in
             re.findall(r'<node id="(\d+)"[^>]*lat="([-\d.]+)" lon="([-\d.]+)"', xml)}
    return Polygon([nodes[ref] for ref in re.findall(r'<nd ref="(\d+)"', xml)])


def osm_districts():
    ids = [s for region in relation(UZBEKISTAN)[1] for s in relation(region)[1]]
    areas = {relation(i)[0].get('name', i): border(i) for i in ids + [str(m) for m in MISSING]}
    return areas | {name: way(osm_id) for name, osm_id in WAYS.items()}


def key(name):
    return re.sub(r'[^a-z]', '', name.lower())


# The border that holds the center of the place: of its type, with its name first.
def owner(place, borders):
    center = Point(place['lng'], place['lat'])
    hits = [name for name, area in borders.items() if area.contains(center)]
    suffix = 'shahri' if place['type'] == 'city' else 'tuman'
    typed = [name for name in hits if suffix in name.lower()] or hits
    typed.sort(key=lambda name: key(place['name'].split()[0]) not in key(name))
    return (typed or [None])[0]


def polyline(ring):
    out, last = [], (0, 0)
    for lng, lat in ring:
        point = (round(lat * PRECISION), round(lng * PRECISION))
        for value in (point[0] - last[0], point[1] - last[1]):
            value = ~(value << 1) if value < 0 else value << 1
            while value >= 0x20:
                out.append(chr((0x20 | (value & 0x1F)) + 63))
                value >>= 5
            out.append(chr(value + 63))
        last = point
    return ''.join(out)


def encode(area):
    polygons = [area] if area.geom_type == 'Polygon' else list(area.geoms)
    return [[polyline(p.exterior.coords)] + [polyline(h.coords) for h in p.interiors]
            for p in polygons if p.area > 1e-7]


# A gap between two sources goes to the neighbour with the longest common border.
def fill_gaps(placed, country):
    gaps = country.difference(unary_union(list(placed.values())))
    for gap in getattr(gaps, 'geoms', [gaps]):
        edge = gap.buffer(GAP_EDGE)
        shared = {i: area.intersection(edge).area for i, area in placed.items()}
        best = max(shared, key=shared.get)
        if shared[best] > 0:
            placed[best] = unary_union([placed[best], gap])


def main():
    places = [p for p in json.load(open(f'{ROOT}/apps/backend/seed/locations.json')) if p['parentId']]
    osm = osm_districts()
    cities = [shape(f['geometry']) for f in json.loads(get(OCHA))['features']
              if 'city' in f['properties']['shapeName']]
    raw, taken = {}, {}
    for place in sorted(places, key=lambda p: p['type'] != 'city'):
        name = FIXED.get(place['id']) or owner(place, osm)
        if place['type'] == 'city' and (name is None or 'shahri' not in name.lower()):
            name = None
        if name is None or name in taken:
            center = Point(place['lng'], place['lat'])
            city = min(cities, key=center.distance)
            if center.distance(city) > NEAR:
                raise RuntimeError(f'No border for {place["name"]}')
            raw[place['id']] = city
        else:
            raw[place['id']], taken[name] = osm[name], place['id']
    for name, place_id in MERGED.items():
        raw[place_id] = unary_union([raw[place_id], osm[name]])
    for name, area in osm.items():
        if name not in taken and name not in MERGED:
            raise RuntimeError(f'OSM district without a place: {name}')
    placed = {}
    for place_id in sorted(raw, key=lambda i: raw[i].area):
        taken_area = unary_union(list(placed.values())) if placed else None
        placed[place_id] = raw[place_id].difference(taken_area) if taken_area else raw[place_id]
    fill_gaps(placed, border(UZBEKISTAN))
    result = {place_id: encode(area.buffer(0)) for place_id, area in placed.items()}
    out = {'source': 'OpenStreetMap contributors (ODbL); OCHA ROCCA (CC BY 3.0 IGO)',
           'date': time.strftime('%Y-%m-%d'), 'places': dict(sorted(result.items()))}
    with open(f'{ROOT}/apps/backend/seed/district-borders.json', 'w') as file:
        json.dump(out, file, ensure_ascii=False, separators=(',', ':'))


main()
