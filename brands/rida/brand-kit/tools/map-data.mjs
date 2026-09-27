// Builds data/uzbekistan.json from Natural Earth admin-1 GeoJSON (public domain).
// Usage: node tools/map-data.mjs <ne_10m_admin_1_states_provinces.geojson>
import fs from 'node:fs';

const WIDTH = 1000;
const LAT0 = 41; // projection latitude (degrees)
const TOLERANCE = 0.015; // simplification tolerance (degrees)
// Region centers and channel codes (docs/37); Toshkent city has no channel.
const CITIES = [
  ['toshkent', 'Toshkent', 41.311, 69.280, null], ['nurafshon', 'Nurafshon', 41.043, 69.358, '10'],
  ['andijon', 'Andijon', 40.782, 72.344, '60'], ['buxoro', 'Buxoro', 39.775, 64.429, '80'],
  ['fargona', 'Fargʻona', 40.386, 71.786, '40'], ['jizzax', 'Jizzax', 40.116, 67.842, '25'],
  ['urganch', 'Urganch', 41.550, 60.633, '90'], ['namangan', 'Namangan', 40.998, 71.673, '50'],
  ['navoiy', 'Navoiy', 40.084, 65.379, '85'], ['qarshi', 'Qarshi', 38.861, 65.789, '70'],
  ['samarqand', 'Samarqand', 39.654, 66.960, '30'], ['guliston', 'Guliston', 40.490, 68.784, '20'],
  ['termiz', 'Termiz', 37.224, 67.278, '75'], ['nukus', 'Nukus', 42.460, 59.610, '95']
];

const src = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const regions = src.features.filter((f) => f.properties.adm0_a3 === 'UZB');
const rings = (g) => (g.type === 'Polygon' ? g.coordinates : g.coordinates.flat());
const all = regions.flatMap((f) => rings(f.geometry).flat());
const minLon = Math.min(...all.map((p) => p[0])), maxLon = Math.max(...all.map((p) => p[0]));
const maxLat = Math.max(...all.map((p) => p[1])), minLat = Math.min(...all.map((p) => p[1]));
const cos = Math.cos((LAT0 * Math.PI) / 180), k = WIDTH / ((maxLon - minLon) * cos);
const project = ([lon, lat]) => [(lon - minLon) * cos * k, (maxLat - lat) * k];

// Ramer-Douglas-Peucker in degrees.
function simplify(pts) {
  if (pts.length < 4) return pts;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  let max = 0, idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = distance(pts[i], a, b);
    if (d > max) { max = d; idx = i; }
  }
  if (max <= TOLERANCE) return [a, b];
  return [...simplify(pts.slice(0, idx + 1)).slice(0, -1), ...simplify(pts.slice(idx))];
}
function distance([x, y], [x1, y1], [x2, y2]) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
  if (len === 0) return Math.hypot(x - x1, y - y1);
  return Math.abs(dy * x - dx * y + x2 * y1 - y2 * x1) / len;
}
const path = (ring) => simplify(ring).map(project).map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('') + 'Z';

const out = {
  source: 'Natural Earth 1:10m admin-1 (public domain), simplified',
  width: WIDTH,
  height: Math.round((maxLat - minLat) * k),
  regions: regions.map((f) => ({ iso: f.properties.iso_3166_2, d: rings(f.geometry).map(path).join('') })),
  cities: CITIES.map(([id, name, lat, lon, code]) => {
    const [x, y] = project([lon, lat]);
    return { id, name, code, x: +x.toFixed(1), y: +y.toFixed(1) };
  })
};
// One region or city per line keeps diffs readable.
const list = (items) => `[\n${items.map((i) => `  ${JSON.stringify(i)}`).join(',\n')}\n]`;
const json = `{"source": ${JSON.stringify(out.source)}, "width": ${out.width}, "height": ${out.height},\n` +
  `"regions": ${list(out.regions)},\n"cities": ${list(out.cities)}}\n`;
fs.writeFileSync(new URL('../data/uzbekistan.json', import.meta.url), json);
console.log(`regions ${out.regions.length}, ${out.width} x ${out.height}`);
