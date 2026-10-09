import {
  adminComplaintRefundPath,
  driverMeetPath,
  NO_SHOW_REASON,
  type Booking,
  type Complaint,
  type Wallet,
} from '@platform/contracts';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { fakeTelegram } from './bots/test-bot';
import { approvedDriver, json, OWNER, read } from './bookings-test-api';
import { changeModerator } from './modules/team';
import { call, doorBooking, registerUser, testEnv } from './test-api';

const telegram = fakeTelegram();
vi.stubGlobal('fetch', telegram.fetch);
afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const DRIVER = 71;
const MISSED = 72;
const RODE = 73;
const MODERATOR = 74;
const HOUR = 3_600_000;
// 09:00 in Tashkent: the trip and «Men keldim» stay inside the day of the bots (07:00 … 22:00). At
// night a card goes without a ring, so a test on the real clock fails in the evening (lesson 204).
const MORNING = Date.parse('2026-10-09T04:00:00Z');
const asDriver = { method: 'POST', app: 'driver' } as const;
const asAdmin = { method: 'POST', app: 'admin' } as const;

async function tripWithTwo() {
  const departAt = Date.now() + 5 * HOUR;
  const trip = { from: '1726273', to: '1718401', departAt, seats: 2, price: 90_000 };
  const published = await read<{ id: string }>(
    call('/driver/trips', DRIVER, {
      app: 'driver',
      ...json({ ...trip, womanOnBoard: false, pickupMode: 'door', comment: '' }),
    }),
  );
  const ids: string[] = [];
  for (const passenger of [MISSED, RODE]) {
    const asked = await read<{ id: string }>(
      call(`/trips/${published.id}/bookings`, passenger, json(doorBooking(1))),
    );
    await call(`/driver/bookings/${asked.id}/confirm`, DRIVER, asDriver);
    ids.push(asked.id);
  }
  return { tripId: published.id, departAt, missed: ids[0] ?? '', rode: ids[1] ?? '' };
}

const driverBooking = async (id: string) =>
  (await read<{ bookings: Booking[] }>(call('/driver/bookings', DRIVER, { app: 'driver' }))).bookings.find(
    (booking) => booking.id === id,
  );

describe('the meeting of the driver and a no-show through the API (docs/126, docs/35, G63)', () => {
  it('marks the meeting, files «Kelmadi» for the team and refunds after the owner confirms', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(MORNING);
    await approvedDriver(DRIVER);
    for (const id of [MISSED, RODE, MODERATOR]) await registerUser(id);
    expect(await changeModerator(testEnv, OWNER, MODERATOR, true)).toBe('ok');
    const { tripId, departAt, missed, rode } = await tripWithTwo();
    expect((await call(driverMeetPath(missed, 'came'), DRIVER, asDriver)).status).toBe(409);
    vi.setSystemTime(departAt - 10 * 60_000);
    // Only the driver of the trip marks it.
    expect((await call(driverMeetPath(missed, 'came'), MISSED, asDriver)).status).toBe(404);
    telegram.calls.length = 0;
    const came = await read<Booking>(call(driverMeetPath(missed, 'came'), DRIVER, asDriver));
    expect(came.driverCameAt).toBe(Date.now());
    const [told] = telegram.sentTo(MISSED);
    // A ring under the trip card of the passenger (G68): «📍 Ali keldi».
    expect(String(told?.body.text)).toMatch(/^📍 .+ keldi$/u);
    expect((await read<Booking>(call(driverMeetPath(rode, 'met'), DRIVER, asDriver))).metAt).toBe(Date.now());
    const twice = await call(driverMeetPath(rode, 'no_show'), DRIVER, asDriver);
    expect([twice.status, await twice.json()]).toEqual([409, { error: 'bookings.already_met' }]);
    expect((await read<Booking>(call(driverMeetPath(missed, 'no_show'), DRIVER, asDriver))).noShowAt).toBe(
      Date.now(),
    );
    // After «Keldi» or «Kelmadi» the ride has begun: the trip is not cancelled any more.
    const cancel = await call(`/driver/trips/${tripId}/cancel`, DRIVER, asDriver);
    expect([cancel.status, await cancel.json()]).toEqual([409, { error: 'trips.wrong_status' }]);

    const queue = await read<{ complaints: Complaint[] }>(call('/admin/complaints', OWNER, { app: 'admin' }));
    const filed = queue.complaints.find((complaint) => complaint.reason === 'no_show');
    expect(filed?.against.role).toBe('passenger');
    // A no-show is not a ride: the team sees no rides of this passenger (docs/129).
    expect(filed?.against.trips).toBe(0);
    const id = filed?.id ?? '';
    const decision = { ...asAdmin, ...json({ action: 'none', refund: true }) };
    expect((await call(`/admin/complaints/${id}/decision`, MODERATOR, decision)).status).toBe(204);
    const refused = await call(adminComplaintRefundPath(id, 'confirm'), MODERATOR, asAdmin);
    expect([refused.status, await refused.json()]).toEqual([403, { error: 'auth.not_owner' }]);
    const commission = came.commission;
    expect((await driverBooking(missed))?.refund).toEqual({ state: 'proposed', amount: commission });

    expect((await call(adminComplaintRefundPath(id, 'confirm'), OWNER, asAdmin)).status).toBe(204);
    expect((await call(adminComplaintRefundPath(id, 'confirm'), OWNER, asAdmin)).status).toBe(409);
    expect(await driverBooking(missed)).toMatchObject({
      noShowAt: came.driverCameAt,
      refund: { state: 'confirmed', amount: commission },
      rated: false,
    });
    const wallet = await read<Wallet>(call('/driver/wallet', DRIVER, { app: 'driver' }));
    expect(wallet.operations[0]).toMatchObject({
      kind: 'admin_adjustment',
      amount: commission,
      bookingId: missed,
      reason: NO_SHOW_REASON,
      passenger: 'Ali',
    });
  });
});
