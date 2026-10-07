import { describe, expect, it, vi } from 'vitest';
import { maplibreEngine } from './maplibre-engine';

const made = vi.hoisted(() => ({ maps: [] as FakeMap[] }));
type FakeMap = {
  center: [number, number];
  moving: boolean;
  calls: string[];
  handlers: Record<string, () => void>;
};
vi.mock('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url', () => ({ default: 'worker.js' }));
vi.mock('pmtiles', () => ({
  Protocol: class {
    tile = vi.fn();
  },
}));
vi.mock('./map-overlays', () => ({ clip: vi.fn(), show: vi.fn(), fit: vi.fn() }));
vi.mock('maplibre-gl', () => ({
  addProtocol: vi.fn(),
  setWorkerUrl: vi.fn(),
  Map: class {
    touchZoomRotate = { disableRotation: vi.fn() };
    state: FakeMap = { center: [69.2, 41.3], moving: false, calls: [], handlers: {} };
    constructor() {
      made.maps.push(this.state);
    }
    on(name: string, handler: () => void) {
      this.state.handlers[name] = handler;
    }
    once(name: string, handler: () => void) {
      this.state.handlers[name] = handler;
    }
    getCenter() {
      const [lng, lat] = this.state.center;
      return { lng, lat };
    }
    off() {}
    resize() {
      this.state.calls.push('resize');
    }
    jumpTo({ center }: { center: [number, number] | { lng: number; lat: number } }) {
      const at: [number, number] = Array.isArray(center) ? center : [center.lng, center.lat];
      this.state.calls.push(`jump ${at.join(',')}`);
      this.state.center = at;
    }
    flyTo({ center }: { center: [number, number] }) {
      // The flight starts: the map is half way when the box changes its size.
      this.state.calls.push(`fly ${center.join(',')}`);
      this.state.center = [69.25, 41.32];
    }
    remove() {}
  },
}));
let sized: () => void = () => undefined;
vi.stubGlobal(
  'ResizeObserver',
  class {
    constructor(callback: () => void) {
      sized = callback;
    }
    observe() {}
    disconnect() {}
  },
);

const SOURCE = { archiveUrl: 'https://api.test/map.pmtiles', fontsUrl: 'https://api.test/fonts' };
const open = async () => {
  const shown = maplibreEngine(
    {} as HTMLElement,
    SOURCE,
    { lat: 41.3, lng: 69.2 },
    { shade: 's', line: 'l', water: 'w', park: 'p', road: 'r' },
    false,
  );
  const map = made.maps.at(-1) as FakeMap;
  map.handlers['load']?.();
  return { view: await shown, map };
};

describe('the map follows the size of its box (G36, docs/100)', () => {
  it('keeps the place in the middle when the sheet goes up or down', async () => {
    const { map } = await open();
    sized();
    expect(map.calls).toEqual(['resize', 'jump 69.2,41.3']);
  });

  it('lands a flight cut by a new size on its place', async () => {
    const { view, map } = await open();
    view.moveTo({ lat: 41.35, lng: 69.3 });
    sized();
    expect(map.center).toEqual([69.3, 41.35]);
  });

  it('jumps without a flight when the phone asks for less motion (G43)', async () => {
    document.documentElement.dataset['motion'] = 'low';
    const { view, map } = await open();
    view.moveTo({ lat: 41.35, lng: 69.3 });
    delete document.documentElement.dataset['motion'];
    expect(map.calls).toEqual(['jump 69.3,41.35']);
  });
});
