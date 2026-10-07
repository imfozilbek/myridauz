import { describe, expect, it } from 'vitest';
import type { FoundPlace } from '@platform/contracts';
import { nearPlaces } from './application/near-places';
import type { PlaceIndex } from './application/ports';

const place = (name: string, kind: FoundPlace['kind']): FoundPlace => ({
  name,
  kind,
  area: 'Chilonzor',
  district: '1726269',
  point: { lat: 41.28, lng: 69.2 },
});

describe('«Yaqin joylar» (docs/126)', () => {
  it('asks the known kinds around the point once and gives each name once, at most 4', async () => {
    const asked: unknown[] = [];
    const index: PlaceIndex = {
      find: async () => [],
      around: async (query, limit) => {
        asked.push({ kinds: query.kinds, limit });
        return ['Chilonzor metrosi', 'Grand', 'Grand', 'Korzinka', 'Feed Up', 'Oqtepa'].map((name) =>
          place(name, 'market'),
        );
      },
    };
    const found = await nearPlaces(index, { lat: 41.28, lng: 69.2 });
    expect(found.map((item) => item.name)).toEqual(['Chilonzor metrosi', 'Grand', 'Korzinka', 'Feed Up']);
    expect(asked).toHaveLength(1);
  });
});
