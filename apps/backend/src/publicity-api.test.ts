import { loadBrand } from '@platform/brands';
import { DAY_MS, tripViewPath, type TripPublicity } from '@platform/contracts';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { app } from './app';
import { approvedDriver, json, read } from './bookings-test-api';
import { HOUR } from './modules/trips/test-kit';
import { call, initData, registerUser, testEnv } from './test-api';

vi.stubGlobal('fetch', async () => Response.json({ ok: true, result: { message_id: 1 } }));
afterAll(() => vi.unstubAllGlobals());

const DRIVER = 191;
const PEOPLE = [192, 193];
const OTHER_DRIVER = 194;
const SEARCHER = 195;
const POSTS_ON = { CHANNEL_POSTS: 'on' };
const BRAND = loadBrand();
// The zone of the brand that covers the end of the test route (docs/63).
const ZONE = BRAND.channels.find((channel) => channel.places.includes('1718401'));
const CHANNEL = { username: ZONE?.username, title: ZONE?.title };

// Each trip two days after the one before: the trips of one driver cannot overlap (docs/103).
let trips = 0;
async function publishTrip(driver = DRIVER, env = {}) {
  await approvedDriver(driver);
  const trip = {
    from: '1726273',
    to: '1718401',
    departAt: Date.now() + 5 * HOUR + (trips += 1) * 2 * DAY_MS,
    seats: 3,
    price: 90_000,
    womanOnBoard: false,
    pickupMode: 'door',
    comment: '',
  };
  return read<{ id: string }>(call('/driver/trips', driver, { app: 'driver', env, ...json(trip) }));
}

const publicityOf = (id: string, env = {}, driver = DRIVER) =>
  read<TripPublicity>(call(`/driver/trips/${id}/publicity`, driver, { app: 'driver', env }));
// The trip page of the passenger app says it was opened: from the search, a post button or a link.
const viewed = (id: string, person: number, app = 'passenger') =>
  call(tripViewPath(id), person, { app, method: 'POST' });

describe('what the driver sees after the publishing (G63, docs/119)', () => {
  it('counts the different people who opened the trip, never the driver', async () => {
    const { id } = await publishTrip();
    for (const person of [...PEOPLE, SEARCHER]) await registerUser(person);
    for (const person of [...PEOPLE, ...PEOPLE]) expect((await viewed(id, person)).status).toBe(204);
    expect((await viewed(id, DRIVER, 'driver')).status).toBe(204);
    expect((await viewed(crypto.randomUUID(), SEARCHER)).status).toBe(204);
    // Reading the trip counts nothing: the search shows it from the list it already has.
    expect((await call(`/trips/${id}`, SEARCHER)).status).toBe(200);
    expect(await publicityOf(id)).toEqual({
      channels: [{ ...CHANNEL, posted: false }],
      views: 2,
      link: `https://t.me/${BRAND.bots.passenger}?startapp=trip_${id}__driver`,
    });
  });

  it('shows the post once Telegram gave it an id, never a post that is not there (docs/15)', async () => {
    const posted = await publishTrip(DRIVER, POSTS_ON);
    expect((await publicityOf(posted.id, POSTS_ON)).channels).toEqual([{ ...CHANNEL, posted: true }]);
    const before = await publishTrip();
    expect((await publicityOf(before.id, POSTS_ON)).channels).toEqual([{ ...CHANNEL, posted: false }]);
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
    await viewed(id, person);
    expect((await publicityOf(id, {}, OTHER_DRIVER)).views).toBe(1);
    const headers = { authorization: `tma ${await initData(person)}`, 'x-mini-app': 'passenger' };
    expect((await app.request('/me', { method: 'DELETE', headers }, testEnv)).status).toBe(204);
    expect((await publicityOf(id, {}, OTHER_DRIVER)).views).toBe(0);
  });
});
