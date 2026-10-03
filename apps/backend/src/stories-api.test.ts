import { describe, expect, it } from 'vitest';
import { app } from './app';
import { approvedDriver, json, read } from './bookings-test-api';
import { call, testEnv } from './test-api';

const DRIVER = 171;
const OTHER = 172;
const jpeg = (size: number) => ({
  method: 'PUT',
  app: 'driver',
  body: new Uint8Array(size),
  headers: { 'content-type': 'image/jpeg' },
});

// Each trip two days after the one before: the trips of one driver cannot overlap (docs/103).
let trips = 0;
async function publishTrip() {
  await approvedDriver(DRIVER);
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
  return read<{ id: string }>(call('/driver/trips', DRIVER, { app: 'driver', ...json(trip) }));
}

describe('«Hikoyaga joylash» (docs/88 L19)', () => {
  it('keeps the picture of the own open trip behind a public link to the trip', async () => {
    const { id } = await publishTrip();
    const story = await read<{ imageUrl: string; bookLink: string }>(
      call(`/driver/trips/${id}/story`, DRIVER, jpeg(3)),
    );
    expect(story.bookLink).toMatch(new RegExp(`\\?startapp=trip_${id}$`, 'u'));
    // Telegram reads the picture without a signature.
    const image = await app.request(new URL(story.imageUrl).pathname, {}, testEnv);
    expect(image.status).toBe(200);
    expect(image.headers.get('content-type')).toBe('image/jpeg');
    expect((await image.arrayBuffer()).byteLength).toBe(3);
  });

  it('refuses another driver, a wrong file and an unknown picture', async () => {
    const { id } = await publishTrip();
    await approvedDriver(OTHER);
    expect((await call(`/driver/trips/${id}/story`, OTHER, jpeg(3))).status).toBe(404);
    expect((await call(`/driver/trips/${id}/story`, DRIVER, jpeg(0))).status).toBe(400);
    const png = { ...jpeg(3), headers: { 'content-type': 'image/png' } };
    expect((await call(`/driver/trips/${id}/story`, DRIVER, png)).status).toBe(400);
    expect((await call(`/driver/trips/${id}/story`, DRIVER, jpeg(1_000_001))).status).toBe(400);
    expect((await app.request('/stories/nope', {}, testEnv)).status).toBe(404);
  });
});
