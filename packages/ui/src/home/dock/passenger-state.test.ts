import { arrivalAt, DAY_MS, HOUR_MS, MINUTE_MS } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { booking, offer, request } from '../../bookings/booking-test-kit';
import { trip } from '../../market/market-test-kit';
import { passengerState, passengerStates, type PassengerMarks } from './passenger-state';

const MEET = 30;
const none: PassengerMarks = { agreed: new Set(), stillOnWay: new Set() };
const seat = { ...booking, status: 'confirmed' as const };
const at = (ms: number) => trip.departAt + ms;
const kind = (lists: Partial<Parameters<typeof passengerStates>[0]>, now: number, marks = none) =>
  passengerState(
    passengerStates(
      { bookings: [], requests: [], offers: [], favorite: null, rateDays: 7, ...lists },
      now,
      MEET,
      marks,
    ),
  ).kind;

describe('the block of a passenger: one state by its level (G76, docs/165)', () => {
  it('is free with nothing, a suggestion with a trip of a saved driver', () => {
    expect(kind({}, at(-DAY_MS))).toBe('idle');
    expect(kind({ favorite: trip }, at(-DAY_MS))).toBe('favorite');
  });

  it('shows an open request, then its offers', () => {
    expect(kind({ requests: [request] }, at(-DAY_MS))).toBe('request');
    expect(kind({ requests: [request], offers: [offer] }, at(-DAY_MS))).toBe('offers');
  });

  it('follows a seat: asked, confirmed, the meeting, the driver at the point', () => {
    expect(kind({ bookings: [booking] }, at(-DAY_MS))).toBe('asked');
    expect(kind({ bookings: [seat] }, at(-DAY_MS))).toBe('confirmed');
    expect(kind({ bookings: [seat] }, at(-20 * MINUTE_MS))).toBe('meeting');
    const came = { ...seat, driverCameAt: at(-5 * MINUTE_MS) };
    expect(kind({ bookings: [came] }, at(-3 * MINUTE_MS))).toBe('driverWaits');
    expect(kind({ bookings: [{ ...came, cameAt: at(-MINUTE_MS) }] }, at(-MINUTE_MS))).toBe('meeting');
  });

  it('asks about a moved time until «Roziman»', () => {
    const moved = { ...seat, trip: { ...trip, firstDepartAt: at(-HOUR_MS) } };
    expect(kind({ bookings: [moved] }, at(-DAY_MS))).toBe('moved');
    expect(kind({ bookings: [moved] }, at(-DAY_MS), { ...none, agreed: new Set([seat.id]) })).toBe(
      'confirmed',
    );
  });

  it('is on the road after boarding, asks an hour after the arrival, until «Hali yoʻldaman»', () => {
    const boarded = { ...seat, boardedAt: at(0) };
    expect(kind({ bookings: [boarded] }, at(HOUR_MS))).toBe('onRoad');
    const late = arrivalAt(trip.departAt, trip.km) + 2 * HOUR_MS;
    expect(kind({ bookings: [boarded] }, late)).toBe('arrivedAsk');
    expect(kind({ bookings: [boarded] }, late, { ...none, stillOnWay: new Set([seat.id]) })).toBe('onRoad');
    // The driver forgot «Keldi»: the minutes of the meeting after the time, the passenger is on the way
    // (G76, in-car.ts); a no-show never is.
    expect(kind({ bookings: [seat] }, at((MEET + 1) * MINUTE_MS))).toBe('onRoad');
    expect(kind({ bookings: [{ ...seat, noShowAt: at(0) }] }, at((MEET + 1) * MINUTE_MS))).toBe('noShow');
  });

  it('ends: rate a week, a refused seat until the trip leaves, a no-show', () => {
    const done = { ...seat, status: 'completed' as const };
    expect(kind({ bookings: [done] }, at(DAY_MS))).toBe('ended');
    expect(kind({ bookings: [{ ...done, rated: true }] }, at(DAY_MS))).toBe('idle');
    expect(kind({ bookings: [done] }, at(8 * DAY_MS))).toBe('idle');
    expect(kind({ bookings: [{ ...seat, status: 'declined' as const }] }, at(-DAY_MS))).toBe('refused');
    expect(kind({ bookings: [{ ...seat, noShowAt: at(0) }] }, at(HOUR_MS))).toBe('noShow');
  });

  it('puts the most important first: a driver waiting beats offers', () => {
    const came = { ...seat, driverCameAt: at(-5 * MINUTE_MS) };
    const lists = { bookings: [came], requests: [request], offers: [offer], favorite: trip, rateDays: 7 };
    const states = passengerStates(lists, at(-3 * MINUTE_MS), MEET, none);
    expect(states.map((state) => state.kind)).toEqual(['driverWaits', 'offers', 'favorite']);
  });
});
