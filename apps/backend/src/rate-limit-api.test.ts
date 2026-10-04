import { describe, expect, it } from 'vitest';
import { app } from './app';
import { call, registerUser } from './test-api';

// Too many requests from one person or one address get 429 with a code (G42, docs/111): the
// booking, the offer, the chat and the feed tickets, the map search, the analytics.
const keys: string[] = [];
const limiter = (allowed: boolean) => ({
  limit: async ({ key }: { key: string }) => (keys.push(key), { success: allowed }),
});
const LIMITED = {
  ACTIONS_LIMIT: limiter(false),
  SEARCH_LIMIT: limiter(false),
  ANALYTICS_LIMIT: limiter(false),
};

describe('rate limits', () => {
  it('stops too many actions and searches of one person', async () => {
    await registerUser(41);
    for (const [path, method] of [
      ['/trips/t1/bookings', 'POST'],
      ['/driver/requests/r1/offers', 'POST'],
      ['/chats/k1/ticket', 'POST'],
      ['/feed/ticket', 'POST'],
      ['/passenger/map/search?q=chilonzor', 'GET'],
    ] as const) {
      const response = await call(path, 41, { method, env: LIMITED });
      expect(response.status, path).toBe(429);
      expect(await response.json()).toEqual({ error: 'rate.limited' });
    }
    expect(keys.every((key) => key.endsWith(':41'))).toBe(true);
  });

  it('lets the reading of own lists go, and limits analytics by the address', async () => {
    await registerUser(42);
    expect((await call('/passenger/bookings', 42, { env: LIMITED })).status).toBe(200);
    const analytics = await app.request(
      '/analytics',
      { method: 'POST', body: '{}', headers: { 'cf-connecting-ip': '10.0.0.1' } },
      LIMITED,
    );
    expect(analytics.status).toBe(429);
    expect(keys.at(-1)).toBe('analytics:10.0.0.1');
  });
});
