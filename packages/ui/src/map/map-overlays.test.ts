import type { Map as MapLibreMap } from 'maplibre-gl';
import { describe, expect, it, vi } from 'vitest';
import { clip } from './map-overlays';

const COLORS = { shade: 'white', line: 'black', water: 'w', park: 'p', road: 'r' };

// A map with only what the drawings use: sources, layers and the bounds.
function fakeLibre() {
  const data = new Map<string, unknown>();
  const map = {
    getSource: (id: string) =>
      data.has(id) ? { setData: (value: unknown) => data.set(id, value) } : undefined,
    addSource: (id: string) => void data.set(id, null),
    addLayer: vi.fn(),
    setMaxBounds: vi.fn(),
  };
  return {
    map: map as unknown as MapLibreMap,
    bounds: map.setMaxBounds,
    shade: () => data.get('overlay-shade'),
  };
}

describe('the cut of a map (G24)', () => {
  it('keeps every map inside Uzbekistan when no district is given', () => {
    const { map, bounds, shade } = fakeLibre();
    clip(map, COLORS, null);
    const corners = (bounds.mock.calls[0]?.[0] as number[][]).flat();
    expect(corners.map(Math.round)).toEqual([56, 37, 73, 46]);
    const holes = (shade() as { geometry: { coordinates: unknown[] } }).geometry.coordinates;
    expect(holes.length).toBeGreaterThan(1);
  });

  it('cuts the map of a point by its district', () => {
    const { map, bounds } = fakeLibre();
    const square = [
      [69.2, 41.2],
      [69.3, 41.2],
      [69.3, 41.3],
      [69.2, 41.2],
    ] as const;
    clip(map, COLORS, [[square]]);
    const corners = (bounds.mock.calls[0]?.[0] as number[][]).flat();
    [69.15, 41.15, 69.35, 41.35].forEach((value, index) => expect(corners[index]).toBeCloseTo(value));
  });
});
