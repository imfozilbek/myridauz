import { describe, expect, it, vi } from 'vitest';
import { createComfortClient } from './comfort-client';
import type { Fetch } from './fetch';

const standing = { rating: { average: 4.9, count: 23 }, onTime: 96, trips: 41 };

describe('the three numbers on top of «Profil» (G65, mockup g65/3)', () => {
  it('reads them for the role of the app', async () => {
    for (const [app, path] of [
      ['passenger', 'passenger/standing'],
      ['driver', 'driver/standing'],
    ] as const) {
      const fetch = vi.fn<Fetch>(async () => Response.json(standing));
      const client = createComfortClient({ baseUrl: 'https://api.test/', app, initData: 'a=1', fetch });
      expect(await client.standing()).toEqual(standing);
      expect(fetch.mock.calls[0]?.[0]).toBe(`https://api.test/${path}`);
    }
  });
});
