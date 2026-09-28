import type { Location } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { app } from './app';
import { localLocations } from './modules/locations';
import { initDataFor } from './shared/auth/test-signing';

const env = { PASSENGER_BOT_TOKEN: '1:passenger', ADMIN_BOT_TOKEN: '3:admin', ADMIN_TELEGRAM_IDS: '900' };
const place = (id: string, parentId: string | null, type: Location['type'], oneCity = false): Location => ({
  id,
  parentId,
  type,
  name: `Place ${id}`,
  lat: 41,
  lng: 69,
  oneCity,
});
localLocations.load([
  place('1726', null, 'region', true),
  place('1726269', '1726', 'district'),
  place('1726266', '1726', 'district'),
  place('1735', null, 'region'),
  place('1735401', '1735', 'city'),
]);

async function put(body: unknown, id: number, app_ = 'admin') {
  const token = app_ === 'admin' ? env.ADMIN_BOT_TOKEN : env.PASSENGER_BOT_TOKEN;
  const headers = {
    authorization: `tma ${await initDataFor(token, id, Math.floor(Date.now() / 1000))}`,
    'x-mini-app': app_,
    'content-type': 'application/json',
  };
  return app.request('/locations/distance', { method: 'PUT', body: JSON.stringify(body), headers }, env);
}

describe('locations API', () => {
  it('gives the public directory with a version for caching', async () => {
    const response = await app.request('/locations', {}, env);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('public');
    const body = (await response.json()) as { locations: Location[] };
    expect(body.locations).toHaveLength(5);
    const etag = response.headers.get('etag') ?? '';
    const again = await app.request('/locations', { headers: { 'if-none-match': etag } }, env);
    expect(again.status).toBe(304);
  });

  it('lets only the team correct a distance', async () => {
    const trip = { from: '1735401', to: '1726269', km: 1150 };
    expect((await put(trip, 5, 'passenger')).status).toBe(403);
    expect((await app.request('/locations/distance', { method: 'PUT' }, env)).status).toBe(401);
    expect((await put(trip, 900)).status).toBe(200);
    const read = await app.request('/locations/distance?from=1726269&to=1735401', {}, env);
    expect(await read.json()).toEqual({ from: '1726269', to: '1735401', km: 1150 });
  });

  it('refuses a trip inside the city and unknown places', async () => {
    const inside = await app.request('/locations/distance?from=1726269&to=1726266', {}, env);
    expect(inside.status).toBe(422);
    expect(await inside.json()).toEqual({ error: 'locations.inside_city' });
    expect((await app.request('/locations/distance?from=1735&to=1726269', {}, env)).status).toBe(404);
    expect((await app.request('/locations/distance?from=x&to=1', {}, env)).status).toBe(400);
    expect((await put({ from: '1726269', to: '1726269', km: 5 }, 900)).status).toBe(422);
    expect((await put({ from: '1726269' }, 900)).status).toBe(400);
  });
});
