import { addProtocol, Map as MapLibreMap, setWorkerUrl, type ErrorEvent as MapErrorEvent } from 'maplibre-gl';
// The map draws its tiles in a worker: Vite bundles it and gives its address.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Protocol } from 'pmtiles';
import type { MapColors, MapEngine, MapView } from './map-engine';
import { MAP_SOURCE, mapStyle } from './map-style';
import { clip, fit, show } from './map-overlays';

// Close enough to see the streets and the houses around the pin.
const START_ZOOM = 16;
// No answer in this time: the map says it did not load, never an endless empty box.
const LOAD_TIMEOUT_MS = 15_000;
// Farther than this (in degrees, about 20 km) the map jumps: a long flight takes seconds.
const FLY_DEGREES = 0.2;
let protocol: Protocol | null = null;

const view = (map: MapLibreMap, colors: MapColors): MapView => ({
  center: () => {
    const { lat, lng } = map.getCenter();
    return { lat, lng };
  },
  onMove: (listener) => void map.on('moveend', listener),
  moveTo: ({ lat, lng }) => {
    const now = map.getCenter();
    const far = Math.abs(now.lat - lat) + Math.abs(now.lng - lng) > FLY_DEGREES;
    const target = { center: [lng, lat] as [number, number], zoom: START_ZOOM };
    if (far) map.jumpTo(target);
    else map.flyTo(target);
  },
  clip: (parts) => clip(map, colors, parts),
  show: (marks, line) => show(map, colors, marks, line),
  fit: (points, covered) => fit(map, points, covered),
  remove: () => map.remove(),
});

// MapLibre over the PMTiles archive (G22, docs/67): the archive is read by parts from the API.
export const maplibreEngine: MapEngine = (box, source, start, colors) => {
  if (!protocol) {
    setWorkerUrl(workerUrl);
    protocol = new Protocol();
    addProtocol('pmtiles', protocol.tile);
  }
  const map = new MapLibreMap({
    container: box,
    style: mapStyle(source),
    center: [start.lng, start.lat],
    zoom: START_ZOOM,
    attributionControl: false,
    // One finger moves the map, two fingers zoom: no rotation, the north stays up.
    dragRotate: false,
    pitchWithRotate: false,
  });
  map.touchZoomRotate.disableRotation();
  return new Promise((resolve, reject) => {
    const fail = (error: unknown) => {
      clearTimeout(timer);
      map.remove();
      reject(error instanceof Error ? error : new Error('map.failed'));
    };
    const timer = setTimeout(() => fail(new Error('map.timeout')), LOAD_TIMEOUT_MS);
    // Only the archive failing stops the map: a missing font leaves one label out.
    const onError = (event: MapErrorEvent & { sourceId?: string }) => {
      if (event.sourceId === MAP_SOURCE) fail(event.error);
    };
    map.on('error', onError);
    map.once('load', () => {
      clearTimeout(timer);
      map.off('error', onError);
      resolve(view(map, colors));
    });
  });
};
