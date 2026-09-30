import type { Point } from '@platform/contracts';
import { vi } from 'vitest';
import type { MapEngine, MapMark } from './map-engine';

const TASHKENT = { lat: 41.3111, lng: 69.2797 };

// Test helper: jsdom draws no map. A fake one keeps the point under the pin, calls the listeners
// of a move, and remembers the marks and the district border it was given.
export function fakeMap(failures = 0) {
  let center: Point = TASHKENT;
  let left = failures;
  let marks: readonly MapMark[] = [];
  let clipped = false;
  const listeners: (() => void)[] = [];
  const engine = vi.fn<MapEngine>(async (_box, _source, start) => {
    if (left-- > 0) throw new Error('map.failed');
    center = start;
    return {
      center: () => center,
      onMove: (listener) => void listeners.push(listener),
      moveTo: (point) => {
        center = point;
        for (const listener of listeners) listener();
      },
      clip: (parts) => void (clipped = parts !== null),
      show: (shown) => void (marks = shown),
      fit: () => undefined,
      remove: () => undefined,
    };
  });
  return { engine, at: () => center, marks: () => marks, clipped: () => clipped };
}
