import { tashkentDate, type Location } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { app } from './app';
import { localLocations } from './modules/locations';
import { call, registerUser, testEnv } from './test-api';

const place = (id: string, parentId: string | null, oneCity = false): Location => ({
  id,
  parentId,
  type: parentId ? 'city' : 'region',
  name: id,
  lat: 41,
  lng: 69,
  oneCity,
});
localLocations.load([
  place('1726', null, true),
  place('1726273', '1726'),
  place('1718', null),
  place('1718401', '1718'),
]);
await localLocations.saveDistance('1718401', '1726273', 300, 0);
const PASSENGER = 51;
const json = (body: unknown) => ({
  method: 'POST',
  body: JSON.stringify(body),
  headers: { 'content-type': 'application/json' },
});

describe('trips and requests API (docs/09)', () => {
  it('needs the Telegram signature and an approved driver to publish', async () => {
    expect((await app.request('/trips?from=1726&to=1718&date=2026-10-01', {}, testEnv)).status).toBe(401);
    await registerUser(PASSENGER);
    const trip = {
      from: '1726273',
      to: '1718401',
      departAt: Date.now() + 3_600_000,
      seats: 2,
      price: 90000,
      womanOnBoard: false,
      comment: '',
    };
    expect((await call('/driver/trips', PASSENGER, { ...json(trip), app: 'driver' })).status).toBe(403);
    expect((await call('/driver/trips', PASSENGER, { ...json({}), app: 'driver' })).status).toBe(400);
    const search = `/trips?from=1726&to=1718&date=${tashkentDate(Date.now())}`;
    expect(await (await call(search, PASSENGER)).json()).toEqual({ trips: [] });
    expect((await call('/trips/00000000-0000-0000-0000-000000000000', PASSENGER)).status).toBe(404);
    expect(
      (await call(`/driver/requests?from=1726&to=1718&date=2026-10-01`, PASSENGER, { app: 'driver' })).status,
    ).toBe(403);
  });

  it('lets a passenger publish, see and cancel a request', async () => {
    await registerUser(PASSENGER);
    const request = {
      from: '1726273',
      to: '1718401',
      date: tashkentDate(Date.now()),
      seats: 1,
      price: 90000,
    };
    const created = await call('/passenger/requests', PASSENGER, json(request));
    expect(created.status).toBe(201);
    const { id } = (await created.json()) as { id: string };
    const mine = (await (await call('/passenger/requests', PASSENGER)).json()) as {
      requests: { id: string }[];
    };
    expect(mine.requests.map((item) => item.id)).toContain(id);
    expect((await call(`/passenger/requests/${id}/cancel`, PASSENGER, { method: 'POST' })).status).toBe(200);
    const recommended = await call('/prices/recommendation?from=1726273&to=1718401', PASSENGER);
    expect(await recommended.json()).toMatchObject({ price: 90000 });
  });
});
