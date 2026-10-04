import { describe, expect, it } from 'vitest';
import { MAX_QUERY_LENGTH, searchRoutes } from './http/search-routes';

// A very long search is cut: it never makes a new edge-cache entry per extra letter (G42, docs/111).
describe('the length of a map search', () => {
  it('searches and keeps in the cache only the first letters', async () => {
    const keys: string[] = [];
    const routes = searchRoutes(() => ({
      index: { find: async () => [] } as never,
      cache: { match: async () => undefined, put: async (key: string) => void keys.push(key) } as never,
      districtsOf: () => null,
    }));
    const long = 'chilonzor'.repeat(500);
    const response = await routes.request(`/passenger/map/search?q=${long}`);
    expect(response.status).toBe(200);
    expect(keys[0]?.length).toBeLessThan(MAX_QUERY_LENGTH * 3);
  });
});
