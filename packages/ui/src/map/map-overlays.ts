import type { GeoJSONSource, LngLatBoundsLike, Map as MapLibreMap } from 'maplibre-gl';
import type { BorderParts, MapColors, MapMark } from './map-engine';
import { UZBEKISTAN_PARTS, type Point } from '@platform/contracts';

// The drawings over the map (G24, docs/71): a shade outside the district, marks and a line.
const SHADE = 'overlay-shade';
const MARKS = 'overlay-marks';
const LINE = 'overlay-line';
const SHADE_OPACITY = 0.75;
const MARK_RADIUS = 9;
const LINE_WIDTH = 3;
// A little room around a district: the edge of the district stays in view.
const MARGIN_DEGREES = 0.05;
const FIT_PADDING = 60;
const WORLD = [
  [-180, -85],
  [180, -85],
  [180, 85],
  [-180, 85],
  [-180, -85],
];
const EMPTY = { type: 'FeatureCollection' as const, features: [] };

function ensure(map: MapLibreMap, colors: MapColors) {
  if (map.getSource(SHADE)) return;
  map.addSource(SHADE, { type: 'geojson', data: EMPTY });
  map.addSource(LINE, { type: 'geojson', data: EMPTY });
  map.addSource(MARKS, { type: 'geojson', data: EMPTY });
  map.addLayer({
    id: SHADE,
    type: 'fill',
    source: SHADE,
    paint: { 'fill-color': colors.shade, 'fill-opacity': SHADE_OPACITY },
  });
  map.addLayer({
    id: LINE,
    type: 'line',
    source: LINE,
    paint: { 'line-color': colors.line, 'line-width': LINE_WIDTH, 'line-dasharray': [2, 1] },
  });
  map.addLayer({
    id: MARKS,
    type: 'circle',
    source: MARKS,
    paint: {
      'circle-radius': MARK_RADIUS,
      'circle-color': ['get', 'color'],
      'circle-stroke-width': 2,
      'circle-stroke-color': colors.shade,
    },
  });
  map.addLayer({
    id: `${MARKS}-label`,
    type: 'symbol',
    source: MARKS,
    layout: { 'text-field': ['get', 'label'], 'text-font': ['Noto Sans Medium'], 'text-size': 11 },
    paint: { 'text-color': colors.shade },
  });
}

const source = (map: MapLibreMap, id: string) => map.getSource(id) as GeoJSONSource;

// Outside the district, or outside Uzbekistan without one: shaded, and the map does not go far.
export function clip(map: MapLibreMap, colors: MapColors, district: BorderParts | null) {
  ensure(map, colors);
  const parts = district ?? UZBEKISTAN_PARTS;
  const outer = parts.map((part) => part[0] ?? []);
  source(map, SHADE).setData({
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [WORLD, ...outer.map((ring) => ring.map(([lng, lat]) => [lng, lat]))],
    },
  });
  const all = outer.flat();
  const lngs = all.map(([lng]) => lng);
  const lats = all.map(([, lat]) => lat);
  const bounds: LngLatBoundsLike = [
    [Math.min(...lngs) - MARGIN_DEGREES, Math.min(...lats) - MARGIN_DEGREES],
    [Math.max(...lngs) + MARGIN_DEGREES, Math.max(...lats) + MARGIN_DEGREES],
  ];
  map.setMaxBounds(bounds);
}

export function show(
  map: MapLibreMap,
  colors: MapColors,
  marks: readonly MapMark[],
  line: readonly Point[] | null,
) {
  ensure(map, colors);
  source(map, MARKS).setData({
    type: 'FeatureCollection',
    features: marks.map(({ point, color, label }) => ({
      type: 'Feature',
      properties: { color, label: label ?? '' },
      geometry: { type: 'Point', coordinates: [point.lng, point.lat] },
    })),
  });
  source(map, LINE).setData(
    line && line.length > 1
      ? {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: line.map(({ lat, lng }) => [lng, lat]) },
        }
      : EMPTY,
  );
}

// covered: the share of the map height at the top under a card; the marks stay below it.
export function fit(map: MapLibreMap, points: readonly Point[], covered = 0) {
  if (points.length === 0) return;
  const top = FIT_PADDING + Math.round(map.getContainer().clientHeight * covered);
  const lngs = points.map((point) => point.lng);
  const lats = points.map((point) => point.lat);
  map.fitBounds(
    [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ],
    // At once: a flight across the country takes seconds and shows nothing.
    {
      padding: { top, bottom: FIT_PADDING, left: FIT_PADDING, right: FIT_PADDING },
      maxZoom: 15,
      animate: false,
    },
  );
}
