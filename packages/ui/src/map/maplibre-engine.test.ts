import { describe, expect, it, vi } from 'vitest';
import { maplibreEngine } from './maplibre-engine';

const made = vi.hoisted(() => ({ options: [] as Record<string, unknown>[] }));
vi.mock('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url', () => ({ default: 'worker.js' }));
vi.mock('pmtiles', () => ({
  Protocol: class {
    tile = vi.fn();
  },
}));
vi.mock('maplibre-gl', () => ({
  addProtocol: vi.fn(),
  setWorkerUrl: vi.fn(),
  Map: class {
    touchZoomRotate = { disableRotation: vi.fn() };
    constructor(options: Record<string, unknown>) {
      made.options.push(options);
    }
    on() {}
    once() {}
    remove() {}
  },
}));

const SOURCE = { archiveUrl: 'https://api.test/map.pmtiles', fontsUrl: 'https://api.test/fonts' };
const START = { lat: 41.3111, lng: 69.2797 };
const COLORS = { shade: 'shade', line: 'line', water: 'water', park: 'park', road: 'road' };

describe('the gestures of a map (docs/94 F11)', () => {
  it('a small map inside a page moves with two fingers, a full screen map with one', () => {
    // The maps never load here: their wait for the archive is cut short.
    vi.useFakeTimers();
    const box = {} as HTMLElement;
    void maplibreEngine(box, SOURCE, START, COLORS, true).catch(() => undefined);
    void maplibreEngine(box, SOURCE, START, COLORS, false).catch(() => undefined);
    vi.runAllTimers();
    vi.useRealTimers();
    expect(made.options.map((options) => options['cooperativeGestures'])).toEqual([true, false]);
  });
});
