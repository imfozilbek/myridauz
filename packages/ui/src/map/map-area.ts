import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import type { Point } from '@platform/contracts';
import type { MapColors } from './map-engine';

// The area of a place before a booking (docs/126, docs/69): a circle, never the exact point.
const AREA = 'overlay-area';
const STEPS = 48;
const KM_PER_DEGREE = 111.32;
const FILL_OPACITY = 0.18;
const LINE_WIDTH = 2;
const FIT_PADDING = 24;

// A circle of so many km around a point as a ring of [lng, lat].
function circleRing({ lat, lng }: Point, km: number): [number, number][] {
  const latDegrees = km / KM_PER_DEGREE;
  const lngDegrees = km / (KM_PER_DEGREE * Math.cos((lat * Math.PI) / 180));
  return Array.from({ length: STEPS + 1 }, (_, step) => {
    const angle = (2 * Math.PI * step) / STEPS;
    return [lng + lngDegrees * Math.cos(angle), lat + latDegrees * Math.sin(angle)];
  });
}

export function area(map: MapLibreMap, colors: MapColors, center: Point, km: number) {
  const ring = circleRing(center, km);
  const data = {
    type: 'Feature' as const,
    properties: {},
    geometry: { type: 'Polygon' as const, coordinates: [ring] },
  };
  const known = map.getSource(AREA) as GeoJSONSource | undefined;
  if (known) known.setData(data);
  else {
    map.addSource(AREA, { type: 'geojson', data });
    map.addLayer({
      id: AREA,
      type: 'fill',
      source: AREA,
      paint: { 'fill-color': colors.line, 'fill-opacity': FILL_OPACITY },
    });
    map.addLayer({
      id: `${AREA}-line`,
      type: 'line',
      source: AREA,
      paint: { 'line-color': colors.line, 'line-width': LINE_WIDTH, 'line-dasharray': [2, 2] },
    });
  }
  const lngs = ring.map(([x]) => x);
  const lats = ring.map(([, y]) => y);
  map.fitBounds(
    [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ],
    { padding: FIT_PADDING, animate: false },
  );
}
