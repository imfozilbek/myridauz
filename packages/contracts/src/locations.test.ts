import { describe, expect, it } from 'vitest';
import { distanceSchema, locationSchema } from './locations';
import { matchesPlace, normalizeSearch } from './place-search';
import { checkRoute } from './route-rule';

const place = (id: string, parentId: string | null, oneCity = false) => ({ id, parentId, oneCity });
const TASHKENT = place('1726', null, true);
const CHILONZOR = place('1726269', '1726');
const YUNUSOBOD = place('1726266', '1726');
const REGION = place('1727', null);
const CHIRCHIQ = place('1727407', '1727');
const PLACES = new Map([TASHKENT, CHILONZOR, YUNUSOBOD, REGION, CHIRCHIQ].map((item) => [item.id, item]));
const find = (id: string) => PLACES.get(id);

describe('checkRoute (docs/14)', () => {
  it('forbids the same place', () => {
    expect(checkRoute(CHIRCHIQ, CHIRCHIQ, find)).toBe('locations.same_place');
  });

  it('forbids a trip inside Toshkent shahri', () => {
    expect(checkRoute(CHILONZOR, YUNUSOBOD, find)).toBe('locations.inside_city');
    expect(checkRoute(TASHKENT, CHILONZOR, find)).toBe('locations.inside_city');
    expect(checkRoute(YUNUSOBOD, TASHKENT, find)).toBe('locations.inside_city');
  });

  it('allows the city to the region and trips between places', () => {
    expect(checkRoute(CHILONZOR, CHIRCHIQ, find)).toBeNull();
    expect(checkRoute(TASHKENT, REGION, find)).toBeNull();
    expect(checkRoute(REGION, CHIRCHIQ, find)).toBeNull();
  });
});

describe('place search', () => {
  it('reads every apostrophe as ʻ', () => {
    for (const query of ["farg'ona", 'farg`ona', 'fargʼona', 'farg‘ona', 'farg’ona', 'FARGʻONA']) {
      expect(normalizeSearch(query)).toBe('fargʻona');
      expect(matchesPlace('Fargʻona viloyati', query)).toBe(true);
    }
  });

  it('matches the start of any word', () => {
    expect(matchesPlace('Mirzo Ulugʻbek', "ulug'")).toBe(true);
    expect(matchesPlace('Qarshi shahri', 'qar')).toBe(true);
    expect(matchesPlace('Qarshi shahri', 'arshi')).toBe(false);
    expect(matchesPlace('Qarshi shahri', '  ')).toBe(true);
  });
});

describe('location schemas', () => {
  it('takes SOATO codes and sane distances', () => {
    const location = { id: '1703', parentId: null, type: 'region', name: 'Andijon', lat: 40.8, lng: 72.3 };
    expect(locationSchema.safeParse({ ...location, oneCity: false }).success).toBe(true);
    expect(locationSchema.safeParse({ ...location, id: 'x1', oneCity: false }).success).toBe(false);
    expect(distanceSchema.safeParse({ from: '1703', to: '1706', km: 0 }).success).toBe(false);
    expect(distanceSchema.safeParse({ from: '1703', to: '1706', km: 350 }).success).toBe(true);
  });
});
