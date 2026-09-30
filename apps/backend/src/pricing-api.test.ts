import { loadBrand } from '@platform/brands';
import type { Location } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { app } from './app';
import { localLocations } from './modules/locations';
import { initDataFor } from './shared/auth/test-signing';

const env = { PASSENGER_BOT_TOKEN: '1:passenger', ADMIN_BOT_TOKEN: '3:admin', ADMIN_TELEGRAM_IDS: '900' };
const place = (id: string, parentId: string | null): Location => ({
  id,
  parentId,
  type: parentId ? 'city' : 'region',
  name: id,
  lat: 41,
  lng: 69,
  oneCity: false,
});
localLocations.load([
  place('1726', null),
  place('1726273', '1726'),
  place('1718', null),
  place('1718401', '1718'),
]);
await localLocations.saveDistance('1718401', '1726273', 300, 0);

async function call(path: string, id: number, miniApp: 'admin' | 'passenger', init: RequestInit = {}) {
  const token = miniApp === 'admin' ? env.ADMIN_BOT_TOKEN : env.PASSENGER_BOT_TOKEN;
  const headers = {
    authorization: `tma ${await initDataFor(token, id, Math.floor(Date.now() / 1000))}`,
    'x-mini-app': miniApp,
    'content-type': 'application/json',
  };
  return app.request(path, { ...init, headers }, env);
}

describe('pricing API (docs/23)', () => {
  it('recommends a price to a signed person', async () => {
    const path = '/prices/recommendation?from=1726273&to=1718401';
    expect((await app.request(path, {}, env)).status).toBe(401);
    const response = await call(path, 5, 'passenger');
    expect(await response.json()).toMatchObject({ km: 300, price: 90000, source: 'formula' });
    expect((await call('/prices/recommendation?from=x', 5, 'passenger')).status).toBe(400);
  });

  it('lets only the team change the formula and the directions', async () => {
    expect((await call('/admin/pricing', 5, 'passenger')).status).toBe(403);
    const state = (await (await call('/admin/pricing', 900, 'admin')).json()) as {
      current: { version: number };
    };
    expect(state.current.version).toBe(1);
    const variables = { ratePerKm: 400, roundStep: 5000, minPrice: 30000, maxPrice: 600000 };
    const post = (path: string, body: unknown) =>
      call(path, 900, 'admin', { method: 'POST', body: JSON.stringify(body) });
    expect((await post('/admin/pricing/preview', variables)).status).toBe(200);
    expect((await post('/admin/pricing', { ...variables, maxPrice: 1 })).status).toBe(400);
    expect((await post('/admin/pricing', variables)).status).toBe(200);
    expect((await post('/admin/pricing/rollback', { version: 1 })).status).toBe(200);
    expect((await post('/admin/pricing/rollback', { version: 99 })).status).toBe(404);
    const put = await call('/admin/pricing/directions', 900, 'admin', {
      method: 'PUT',
      body: JSON.stringify({ from: '1726', to: '1718', price: 100000 }),
    });
    expect(put.status).toBe(200);
    const recommended = await call('/prices/recommendation?from=1718401&to=1726273', 5, 'passenger');
    expect(await recommended.json()).toMatchObject({ price: 100000, source: 'manual' });
  });
});

describe('public prices for the landing (docs/59)', () => {
  it('gives the price of two places without a signature, cached, and only to the brand site', async () => {
    const site = `https://${loadBrand().domain}`;
    const ask = (query: string, origin = site) =>
      app.request(`/public/price?${query}`, { headers: { origin } }, env);
    const response = await ask('from=1726273&to=1718401');
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('max-age=3600');
    expect(response.headers.get('access-control-allow-origin')).toBe(site);
    // The same recommendation as in the Mini Apps: the team changed the formula in the test above.
    expect(await response.json()).toEqual({
      from: '1726273',
      to: '1718401',
      km: 300,
      price: expect.any(Number),
    });
    expect((await ask('from=1726273&to=1718')).status).toBe(404);
    expect((await ask('from=x')).status).toBe(400);
    const other = await ask('from=1726273&to=1718401', 'https://evil.uz');
    expect(other.headers.get('access-control-allow-origin')).toBeNull();
  });
});
