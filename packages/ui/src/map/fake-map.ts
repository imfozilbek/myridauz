import type { Point } from '@platform/contracts';
import { vi } from 'vitest';
import type { MapEngine, MapMark, PlacedPin } from './map-engine';

const TASHKENT = { lat: 41.3111, lng: 69.2797 };

// Test helper: jsdom draws no map. A fake one keeps the point under the pin, calls the listeners
// of a move, and remembers the marks and the district border it was given.
export function fakeMap(failures = 0) {
  let center: Point = TASHKENT;
  let left = failures;
  let marks: readonly MapMark[] = [];
  let pinned: readonly PlacedPin[] = [];
  let clipped = false;
  // What happened to the map, in order: a cut, its removal, a move.
  const log: string[] = [];
  const listeners: (() => void)[] = [];
  const engine = vi.fn<MapEngine>(async (_box, _source, start) => {
    if (left-- > 0) throw new Error('map.failed');
    center = start;
    return {
      center: () => center,
      onMove: (listener) => void listeners.push(listener),
      moveTo: (point) => {
        log.push('move');
        center = point;
        for (const listener of listeners) listener();
      },
      clip: (parts) => {
        clipped = parts !== null;
        log.push(clipped ? 'clip' : 'unclip');
      },
      show: (shown) => void (marks = shown),
      pins: (placed) => void (pinned = placed),
      fit: () => undefined,
      area: () => void log.push('area'),
      remove: () => undefined,
    };
  });
  return {
    engine,
    at: () => center,
    marks: () => marks,
    pins: () => pinned,
    clipped: () => clipped,
    log: () => log,
  };
}
