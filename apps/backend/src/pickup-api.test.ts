import { afterAll, describe, expect, it, vi } from 'vitest';
import { fakeTelegram } from './bots/test-bot';
import { approvedDriver, json, read } from './bookings-test-api';
import { call } from './test-api';
import { registerUser } from './test-api';

const telegram = fakeTelegram();
vi.stubGlobal('fetch', telegram.fetch);
afterAll(() => vi.unstubAllGlobals());

const DRIVER = 71;
const PASSENGER = 72;
const STRANGER = 73;
const TASHKENT = { lat: 41.2995, lng: 69.2401 };

async function booking(confirm: boolean) {
  const trip = await read<{ id: string }>(
    call('/driver/trips', DRIVER, {
      app: 'driver',
      ...json({
        from: '1726273',
        to: '1718401',
        departAt: Date.now() + 5 * 3_600_000,
        seats: 3,
        price: 90_000,
        womanOnBoard: false,
        comment: '',
      }),
    }),
  );
  const asked = await read<{ id: string }>(call(`/trips/${trip.id}/bookings`, PASSENGER, json({ seats: 1 })));
  if (confirm) await call(`/driver/bookings/${asked.id}/confirm`, DRIVER, { method: 'POST', app: 'driver' });
  return asked.id;
}

const pickup = (id: string, who: number, point: unknown) =>
  call(`/passenger/bookings/${id}/pickup`, who, json(point));

describe('the pickup point from the map of the Mini App (docs/14, G22)', () => {
  it('saves the point of a confirmed booking and tells the driver', async () => {
    await approvedDriver(DRIVER);
    await registerUser(PASSENGER);
    const id = await booking(true);
    const before = telegram.calls.length;
    const saved = await read<{ pickup: unknown }>(pickup(id, PASSENGER, TASHKENT));
    expect(saved.pickup).toEqual(TASHKENT);
    const driverView = await read<{ bookings: { id: string; pickup: unknown }[] }>(
      call('/driver/bookings', DRIVER, { app: 'driver' }),
    );
    expect(driverView.bookings.find((item) => item.id === id)?.pickup).toEqual(TASHKENT);
    const toDriver = telegram.calls.slice(before).filter((sent) => sent.body.chat_id === DRIVER);
    expect(toDriver.length).toBeGreaterThan(0);
  });

  it('refuses a point outside Uzbekistan, a booking not confirmed and a booking of another person', async () => {
    await registerUser(STRANGER);
    const id = await booking(true);
    const almaty = await pickup(id, PASSENGER, { lat: 43.2389, lng: 76.8897 });
    expect(almaty.status).toBe(422);
    expect(await almaty.json()).toEqual({ error: 'bookings.outside_country' });
    expect((await pickup(id, STRANGER, TASHKENT)).status).toBe(404);
    expect((await pickup(id, PASSENGER, { lat: 'x' })).status).toBe(400);
    const waiting = await booking(false);
    expect((await pickup(waiting, PASSENGER, TASHKENT)).status).toBe(409);
  });
});
