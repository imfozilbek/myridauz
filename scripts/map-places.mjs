// The places of the map search (G23, docs/67): reads every tile of the most detailed level of the
// archive, takes the named places, streets and landmarks and writes the SQL of the D1 index.
// Called by map-data.mjs after the extract: the index always has the date of the map.
import { closeSync, openSync, readSync, writeFileSync } from 'node:fs';
import { VectorTile } from '@mapbox/vector-tile';
import { PbfReader } from 'pbf';
import { PMTiles } from 'pmtiles';
import { placeIndexSql } from '../apps/backend/src/modules/map/infrastructure/place-index-sql.ts';
import { districtBorders } from '../apps/backend/src/modules/map/infrastructure/district-borders.ts';
import { areaFinder, collectPlaces } from '../apps/backend/src/modules/map/infrastructure/place-rows.ts';
import locations from '../apps/backend/seed/locations.json' with { type: 'json' };
import { insideUzbekistan } from '../packages/contracts/src/uzbekistan.ts';
import border from '../packages/contracts/src/uzbekistan-border.json' with { type: 'json' };

// The most detailed level: every landmark and every street has its name there.
const ZOOM = 15;
const LAYERS = ['places', 'pois', 'roads'];
const OTHER_NAMES = ['name:ru', 'name:en'];

const fileSource = (path) => {
  const file = openSync(path, 'r');
  return {
    file,
    getKey: () => path,
    getBytes: async (offset, length) => {
      const bytes = Buffer.alloc(length);
      readSync(file, bytes, 0, length, offset);
      return { data: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + length) };
    },
  };
};

const tileX = (lng) => Math.floor(((lng + 180) / 360) * 2 ** ZOOM);
const tileY = (lat) => {
  const radians = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(radians) + 1 / Math.cos(radians)) / Math.PI) / 2) * 2 ** ZOOM);
};

function bounds() {
  const vertices = border.flat(2);
  const lngs = vertices.map(([lng]) => lng);
  const lats = vertices.map(([, lat]) => lat);
  return {
    west: Math.min(...lngs),
    east: Math.max(...lngs),
    south: Math.min(...lats),
    north: Math.max(...lats),
  };
}

// A point of a place: the point itself, or the middle of the first line of a street.
function middle(geometry) {
  if (geometry.type === 'Point') return geometry.coordinates;
  const line = geometry.type === 'LineString' ? geometry.coordinates : geometry.coordinates[0];
  return line?.[Math.floor(line.length / 2)];
}

function* namedThings(tile, x, y) {
  for (const layer of LAYERS) {
    const features = tile.layers[layer];
    for (let index = 0; index < (features?.length ?? 0); index += 1) {
      const feature = features.feature(index);
      const { name, kind } = feature.properties;
      if (typeof name !== 'string' || typeof kind !== 'string') continue;
      const [lng, lat] = middle(feature.toGeoJSON(x, y, ZOOM).geometry) ?? [];
      if (lng === undefined) continue;
      const uz = feature.properties['name:uz'];
      const names = OTHER_NAMES.map((key) => feature.properties[key]).filter(
        (value) => typeof value === 'string',
      );
      yield { layer, kind, name, ...(typeof uz === 'string' ? { uz } : {}), names, point: { lat, lng } };
    }
  }
}

async function readThings(archive) {
  const things = [];
  const { west, east, south, north } = bounds();
  for (let x = tileX(west); x <= tileX(east); x += 1)
    for (let y = tileY(north); y <= tileY(south); y += 1) {
      const tile = await archive.getZxy(ZOOM, x, y);
      if (tile) things.push(...namedThings(new VectorTile(new PbfReader(new Uint8Array(tile.data))), x, y));
    }
  return things;
}

// Writes the SQL of the index next to the archive and says how many places it has.
export async function writePlaceIndex(archivePath, sqlPath) {
  const source = fileSource(archivePath);
  try {
    const areas = locations.filter((place) => place.parentId !== null);
    const areaOf = areaFinder(areas, districtBorders());
    const places = collectPlaces(await readThings(new PMTiles(source)), areaOf, insideUzbekistan);
    writeFileSync(sqlPath, placeIndexSql(places).join('\n'));
    return places.length;
  } finally {
    closeSync(source.file);
  }
}
