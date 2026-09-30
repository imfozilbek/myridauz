import type { Point } from '@platform/contracts';
import { createContext, useContext } from 'react';

// Where the map of the Mini App lives (G22, docs/67): the archive of Uzbekistan and label fonts.
export type MapSource = { readonly archiveUrl: string; readonly fontsUrl: string };

// A shown map: the point under the pin in the middle, and a way to move it.
export type MapView = {
  center(): Point;
  onMove(listener: () => void): void;
  moveTo(point: Point): void;
  remove(): void;
};

// Draws a map into the box; fails when the map cannot load (no network, no archive).
export type MapEngine = (box: HTMLElement, source: MapSource, start: Point) => Promise<MapView>;

// The map library is big: it is fetched only when a map screen opens (a separate chunk).
const loadMapLibre = async (): Promise<MapEngine> => (await import('./maplibre-engine')).maplibreEngine;

// Tests give a fake engine: jsdom cannot draw a map.
export const MapEngineContext = createContext<() => Promise<MapEngine>>(loadMapLibre);
export const useMapEngine = () => useContext(MapEngineContext);
