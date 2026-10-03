import { afterEach, describe, expect, it } from 'vitest';
import { recentPlaces, rememberPlace } from './recent-places';

afterEach(() => localStorage.clear());

const chorsu = (lat: number) => ({
  point: { lat, lng: 69.2355 },
  name: { step: 'landmark' as const, name: 'Chorsu bozori' },
  district: '1726269',
});

describe('«Oxirgi joylar» without a repeat (G36, docs/100 DS2)', () => {
  it('keeps one place for one name in one district, at the newest point', () => {
    rememberPlace(chorsu(41.3265));
    rememberPlace(chorsu(41.3267));
    expect(recentPlaces()).toEqual([chorsu(41.3267)]);
  });

  it('keeps the same name in two districts, and two points with no name', () => {
    rememberPlace(chorsu(41.3265));
    rememberPlace({ ...chorsu(41.3265), district: '1730401' });
    rememberPlace({ ...chorsu(41.1), name: null });
    rememberPlace({ ...chorsu(41.2), name: null });
    expect(recentPlaces()).toHaveLength(4);
  });
});
