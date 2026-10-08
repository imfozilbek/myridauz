import { loadBrand } from '@platform/brands';
import type { TripPublicity } from '@platform/contracts';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { app } from './app';
import { approvedDriver, json, read } from './bookings-test-api';
import { call, initData, registerUser, testEnv } from './test-api';

vi.stubGlobal('fetch', async () => Response.json({ ok: true, result: { message_id: 1 } }));
afterAll(() => vi.unstubAllGlobals());

const DRIVER = 191;
const PEOPLE = [192, 193];
const OTHER_DRIVER = 194;
const BRAND = loadBrand();
// The zone of the brand that covers the end of the test route (docs/63).
const ZONE = BRAND.channels.find((channel) => channel.places.includes('1718401'));
const CHANNEL = { username: ZONE?.username, title: ZONE?.title };

// Each trip two days after the one before: the trips of one driver cannot overlap (docs/103).
let trips = 0;
async function publishTrip(driver = DRIVER) {
  await approvedDriver(driver);
  const trip = {
    from: '1726273',
    to: '1718401',
    departAt: Date.now() + 5 * 3_600_000 + (trips += 1) * 2 * 86_400_000,
    seats: 3,
    price: 90_000,
    womanOnBoard: false,
    pickupMode: 'both',
    comment: '',
  };
  return read<{ id: string }>(call('/driver/trips', driver, { app: 'driver', ...json(trip) }));
}

const publicityOf = (id: string, env = {}, driver = DRIVER) =>
  read<TripPublicity>(call(`/driver/trips/${id}/publicity`, driver, { app: 'driver', env }));

describe('what the driver sees after the publishing (G63, docs/119)', () => {
  it('counts the different people who opened the trip, never the driver', async () => {
    const { id } = await publishTrip();
    for (const person of PEOPLE) await registerUser(person);
    for (const person of [...PEOPLE, ...PEOPLE])
      expect((await call(`/trips/${id}`, person)).status).toBe(200);
    expect((await call(`/trips/${id}`, DRIVER, { app: 'driver' })).status).toBe(200);
    expect(await publicityOf(id)).toEqual({
      channels: [{ ...CHANNEL, posted: false }],
      views: 2,
      link: `https://t.me/${BRAND.bots.passenger}?startapp=trip_${id}__driver`,
    });
  });

  it('shows the post of an open trip once the channel posts are on (docs/15)', async () => {
    const { id } = await publishTrip();
    expect((await publicityOf(id, { CHANNEL_POSTS: 'on' })).channels).toEqual([{ ...CHANNEL, posted: true }]);
  });

  it('answers only the driver of the trip', async () => {
    const { id } = await publishTrip();
    await approvedDriver(OTHER_DRIVER);
    const path = `/driver/trips/${id}/publicity`;
    expect((await call(path, OTHER_DRIVER, { app: 'driver' })).status).toBe(404);
    expect((await call(path, 192)).status).toBe(404);
    const unknown = `/driver/trips/${crypto.randomUUID()}/publicity`;
    expect(await (await call(unknown, DRIVER, { app: 'driver' })).json()).toEqual({
      error: 'trips.not_found',
    });
  });

  it('forgets the views of a deleted account (docs/30)', async () => {
    const { id } = await publishTrip(OTHER_DRIVER);
    const [person = 0] = PEOPLE;
    await registerUser(person);
    await call(`/trips/${id}`, person);
    expect((await publicityOf(id, {}, OTHER_DRIVER)).views).toBe(1);
    const headers = { authorization: `tma ${await initData(person)}`, 'x-mini-app': 'passenger' };
    expect((await app.request('/me', { method: 'DELETE', headers }, testEnv)).status).toBe(204);
    expect((await publicityOf(id, {}, OTHER_DRIVER)).views).toBe(0);
  });
});
