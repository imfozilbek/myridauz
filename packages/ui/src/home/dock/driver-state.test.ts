import { DAY_MS, HOUR_MS, MINUTE_MS, tripEndsAt } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { booking, wallet } from '../../bookings/booking-test-kit';
import { trip } from '../../market/market-test-kit';
import { driverStates } from './driver-state';

const MEET = 30;
const at = (ms: number) => trip.departAt + ms;
const seat = { ...booking, status: 'confirmed' as const };
type Lists = Parameters<typeof driverStates>[0];
const base: Lists = {
  status: 'approved',
  welcome: false,
  trips: [],
  bookings: [],
  wallet,
  fewSeats: 5,
  rateDays: 7,
  unseen: new Set(),
};
const kinds = (lists: Partial<Lists>, now: number) =>
  driverStates({ ...base, ...lists }, now, MEET).map((state) => state.kind);

describe('the block of a driver: one state by its level (G76, docs/165)', () => {
  it('follows the application before anything', () => {
    expect(kinds({ status: 'draft' }, at(0))).toEqual(['draft']);
    expect(kinds({ status: 'pending' }, at(0))).toEqual(['pending']);
    expect(kinds({ status: 'changes_requested' }, at(0))).toEqual(['fix']);
  });

  it('is free, welcomes the first visit, warns of a low wallet', () => {
    expect(kinds({}, at(0))).toEqual(['idle']);
    expect(kinds({ welcome: true }, at(0))).toEqual(['welcome']);
    expect(kinds({ wallet: { ...wallet, seatsLeft: 3 } }, at(0))).toEqual(['low']);
  });

  it('shows the trip, its requests first, and the money short for them', () => {
    expect(kinds({ trips: [trip] }, at(-DAY_MS))[0]).toBe('published');
    expect(kinds({ trips: [trip], bookings: [booking] }, at(-DAY_MS))[0]).toBe('requests');
    const poor = { ...wallet, bonus: 0, main: 1000 };
    expect(kinds({ trips: [trip], bookings: [booking], wallet: poor }, at(-DAY_MS))[0]).toBe('short');
    // A request whose time to answer is over waits for nothing: no «Javob berish», no money short.
    const over = { ...booking, expiresAt: at(-DAY_MS) - MINUTE_MS };
    expect(kinds({ trips: [trip], bookings: [over], wallet: poor }, at(-DAY_MS))).toEqual(['published']);
  });

  it('says an offer taken once, until it is seen', () => {
    expect(kinds({ trips: [trip], bookings: [seat], unseen: new Set([seat.id]) }, at(-DAY_MS))[0]).toBe(
      'accepted',
    );
  });

  it('leads the day: the departure, a passenger waiting, the point, then asks when late', () => {
    expect(kinds({ trips: [trip], bookings: [seat] }, at(-40 * MINUTE_MS))[0]).toBe('depart');
    const waits = { ...seat, cameAt: at(-5 * MINUTE_MS) };
    expect(kinds({ trips: [trip], bookings: [waits] }, at(-4 * MINUTE_MS))[0]).toBe('passengerWaits');
    const there = { ...waits, driverCameAt: at(-2 * MINUTE_MS) };
    expect(kinds({ trips: [trip], bookings: [there] }, at(-MINUTE_MS))[0]).toBe('atPoint');
    expect(kinds({ trips: [trip] }, at(HOUR_MS + MINUTE_MS))[0]).toBe('departAsk');
  });

  it('is on the road after «Yoʻlga chiqdim», then asks for the stars a week', () => {
    const left = { ...trip, departedAt: at(0) };
    expect(kinds({ trips: [left] }, at(HOUR_MS))).toEqual(['onRoad']);
    const done = { ...trip, status: 'completed' as const, arrivedAt: at(4 * HOUR_MS) };
    const rider = { ...seat, status: 'completed' as const };
    expect(kinds({ trips: [done], bookings: [rider] }, at(DAY_MS))).toEqual(['ended']);
    expect(kinds({ trips: [done], bookings: [{ ...rider, rated: true }] }, at(DAY_MS))).toEqual(['idle']);
    // The days of the brand count from the end of the trip, as on the page of the trip (docs/129).
    const end = tripEndsAt(trip.departAt, trip.km);
    expect(kinds({ trips: [done], bookings: [rider] }, end + 7 * DAY_MS - MINUTE_MS)).toEqual(['ended']);
    expect(kinds({ trips: [done], bookings: [rider], rateDays: 3 }, end + 3 * DAY_MS)).toEqual(['idle']);
  });
});
