import { addProtocol, Map as MapLibreMap, setWorkerUrl, type ErrorEvent as MapErrorEvent } from 'maplibre-gl';
// The map draws its tiles in a worker: Vite bundles it and gives its address.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import './maplibre.css';
import { Protocol } from 'pmtiles';
import type { MapColors, MapEngine, MapView } from './map-engine';
import { MAP_SOURCE, mapStyle } from './map-style';
import { motionIsLow } from '../telegram/low-motion';
import { clip, fit, show } from './map-overlays';
import { area } from './map-area';

// Close enough to see the streets and the houses around the pin.
const START_ZOOM = 16;
// No answer in this time: the map says it did not load, never an endless empty box.
const LOAD_TIMEOUT_MS = 15_000;
// Farther than this (in degrees, about 20 km) the map jumps: a long flight takes seconds.
const FLY_DEGREES = 0.2;
let protocol: Protocol | null = null;

// The box grows and shrinks with the sheet under it (G36, docs/100): the place in the middle, under
// the pin, stays the same. A flight cut by a new size lands on its place at once.
function follow(map: MapLibreMap, box: HTMLElement) {
  let flight: [number, number] | null = null;
  map.on('moveend', () => (flight = null));
  const sized = new ResizeObserver(() => {
    const center = flight ?? map.getCenter();
    map.resize();
    map.jumpTo({ center });
  });
  sized.observe(box);
  return {
    // A weak phone or «less motion» lands at once: a flight there is a few jerks (G43).
    flyTo: (center: [number, number]) => {
      if (motionIsLow()) return map.jumpTo({ center, zoom: START_ZOOM });
      flight = center;
      return map.flyTo({ center, zoom: START_ZOOM });
    },
    stop: () => sized.disconnect(),
  };
}

const view = (map: MapLibreMap, colors: MapColors, box: HTMLElement): MapView => {
  const sized = follow(map, box);
  return {
    center: () => {
      const { lat, lng } = map.getCenter();
      return { lat, lng };
    },
    onMove: (listener) => void map.on('moveend', listener),
    moveTo: ({ lat, lng }) => {
      const now = map.getCenter();
      const far = Math.abs(now.lat - lat) + Math.abs(now.lng - lng) > FLY_DEGREES;
      if (far) map.jumpTo({ center: [lng, lat], zoom: START_ZOOM });
      else sized.flyTo([lng, lat]);
    },
    clip: (parts) => clip(map, colors, parts),
    show: (marks, line) => show(map, colors, marks, line),
    fit: (points, covered) => fit(map, points, covered),
    area: (center, km) => area(map, colors, center, km),
    remove: () => (sized.stop(), map.remove()),
  };
};

// MapLibre over the PMTiles archive (G22, docs/67): the archive is read by parts from the API.
export const maplibreEngine: MapEngine = (box, source, start, colors, inline) => {
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
    // One finger moves the map, two fingers zoom: no rotation, the north stays up. A small map
    // inside a page leaves one finger to the page: two fingers move it (docs/94 F11).
    cooperativeGestures: inline,
    dragRotate: false,
    pitchWithRotate: false,
    // The size is followed below, with the place in the middle kept.
    trackResize: false,
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
      const shown = view(map, colors, box);
      // Every map shows Uzbekistan only: the rest is shaded and out of reach.
      shown.clip(null);
      resolve(shown);
    });
  });
};
