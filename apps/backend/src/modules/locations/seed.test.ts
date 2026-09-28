import { describe, expect, it } from 'vitest';
import factors from '../../../seed/road-factors.json' with { type: 'json' };
import places from '../../../seed/locations.json' with { type: 'json' };
import { roadFactor, roadKm } from './domain/distance';
import { buildSeedSql, seedDistances, type SeedPlace } from './infrastructure/seed-sql';

// The seed of the directory (docs/48). The date of the seed: the version of the directory.
const SEED_STAMP = 1_790_000_000_000;
const seed = places as readonly SeedPlace[];
const byId = new Map(seed.map((place) => [place.id, place]));
const REGION_COUNT = 14;
const TASHKENT_CITY = '1726';
// The Tashkent point of docs/16: the city center, in Mirobod district.
const TASHKENT_CENTER = '1726273';
const TOLERANCE = 0.1;

// docs/16: from the city of Tashkent to the center of each region, km by road.
const DOCS_16 = [
  ['Nurafshon', 35],
  ['Guliston', 120],
  ['Jizzax', 200],
  ['Namangan', 290],
  ['Samarqand', 300],
  ['Fargʻona', 320],
  ['Andijon', 350],
  ['Navoiy', 465],
  ['Qarshi', 490],
  ['Buxoro', 570],
  ['Termiz', 700],
  ['Urganch', 1000],
  ['Nukus', 1150],
] as const;

const cityNamed = (name: string) =>
  seed.find((place) => place.type === 'city' && place.name.startsWith(`${name}`));

describe('locations seed (docs/14)', () => {
  it('has 14 regions, every place in a region, SOATO ids', () => {
    const regions = seed.filter((place) => place.parentId === null);
    expect(regions).toHaveLength(REGION_COUNT);
    expect(regions.filter((region) => region.oneCity).map((region) => region.id)).toEqual([TASHKENT_CITY]);
    expect(new Set(seed.map((place) => place.id)).size).toBe(seed.length);
    for (const place of seed.filter((item) => item.parentId !== null)) {
      expect(byId.get(place.parentId ?? '')?.parentId).toBeNull();
      expect(place.id.startsWith(place.parentId ?? '')).toBe(true);
    }
  });

  it('writes names with the letters oʻ gʻ and the sign ʼ only (docs/25)', () => {
    for (const place of seed) expect(place.name).not.toMatch(/['`‘’´]/);
    expect(seed.some((place) => place.name.includes('ʻ'))).toBe(true);
  });

  it('keeps the 13 directions from Tashkent within 10% of docs/16', () => {
    const center = byId.get(TASHKENT_CENTER);
    if (!center) throw new Error('test.tashkent_center_missing');
    for (const [name, km] of DOCS_16) {
      const city = cityNamed(name);
      if (!city?.parentId) throw new Error(`test.city_missing:${name}`);
      const road = roadKm(center, city, roadFactor(factors, TASHKENT_CITY, city.parentId));
      expect(Math.abs(road - km) / km, name).toBeLessThanOrEqual(TOLERANCE);
    }
  });

  it('has no distance for a trip inside Toshkent shahri', () => {
    const pairs = seedDistances(seed, factors);
    const inside = pairs.filter(
      (pair) =>
        byId.get(pair.from)?.parentId === TASHKENT_CITY && byId.get(pair.to)?.parentId === TASHKENT_CITY,
    );
    expect(inside).toHaveLength(0);
    expect(pairs.every((pair) => pair.from < pair.to && pair.km > 0)).toBe(true);
  });

  // pnpm vitest run -u apps/backend/src/modules/locations/seed.test.ts rewrites the migration.
  it('matches migrations/0003_locations.sql', async () => {
    await expect(buildSeedSql(seed, factors, SEED_STAMP)).toMatchFileSnapshot(
      '../../../migrations/0003_locations.sql',
    );
  });
});
