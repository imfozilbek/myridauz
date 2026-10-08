import type { Point } from '@platform/contracts';
import { createContext, useContext } from 'react';

// Where the map of the Mini App lives (G22, docs/67): the archive of Uzbekistan and label fonts.
export type MapSource = { readonly archiveUrl: string; readonly fontsUrl: string };

// A mark on the map (G24): the start, the end, the pitak, a stop of the driver, with a short label.
export type MapMark = { readonly point: Point; readonly color: string; readonly label?: string };
// A pin the page draws (an icon of the library), held by the map at its point (mockup g63/4 screen 12).
export type PlacedPin = { readonly point: Point; readonly element: HTMLElement };
// The parts of a border: rings of [lng, lat], the outer one first (docs/71).
export type BorderParts = readonly (readonly (readonly (readonly [number, number])[])[])[];

// The colors of the drawings over the map, from the theme of the brand (docs/20).
// The colors of a map from the brand tokens (docs/20, docs/126): the shade and the line drawn over it,
// and the own style of the map: water, parks and highways.
export type MapColors = {
  readonly shade: string;
  readonly line: string;
  readonly water: string;
  readonly park: string;
  readonly road: string;
};

// A shown map: the point under the pin in the middle, and a way to move it. G24: the map of one
// district (the rest is shaded and out of reach), marks with a line, all marks in view.
export type MapView = {
  center(): Point;
  onMove(listener: () => void): void;
  moveTo(point: Point): void;
  // The map of one district; null: the whole of Uzbekistan (every map starts so).
  clip(parts: BorderParts | null): void;
  show(marks: readonly MapMark[], line: readonly Point[] | null): void;
  // Pins at their points; the new ones take the place of the old ones.
  pins(pins: readonly PlacedPin[]): void;
  // covered: the share of the height at the top hidden by a card.
  fit(points: readonly Point[], covered?: number): void;
  // The area of a place before a booking: a circle of so many km in the middle (docs/126).
  area(center: Point, km: number): void;
  remove(): void;
};

// Draws a map into the box; fails when the map cannot load (no network, no archive).
// inline: a small map inside a page, one finger scrolls the page, two move the map (docs/94 F11).
export type MapEngine = (
  box: HTMLElement,
  source: MapSource,
  start: Point,
  colors: MapColors,
  inline: boolean,
) => Promise<MapView>;

// The map library is big: it is fetched only when a map screen opens (a separate chunk).
const loadMapLibre = async (): Promise<MapEngine> => (await import('./maplibre-engine')).maplibreEngine;

// Tests give a fake engine: jsdom cannot draw a map.
export const MapEngineContext = createContext<() => Promise<MapEngine>>(loadMapLibre);
export const useMapEngine = () => useContext(MapEngineContext);
