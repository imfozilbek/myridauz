import { describe, expect, it } from 'vitest';
import { aTrip, DEPART, DRIVER } from '../test-record';
import { cancel } from './trip';
import { retime } from './trip-change';
import { arrive, depart } from './trip-progress';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const SHIFT = 60;

describe('«Yoʻlga chiqdim» of the driver (G63, docs/35)', () => {
  it('works for the own live trip from an hour before its time, once', () => {
    expect(depart(aTrip, DRIVER + 1, DEPART)).toBe('trips.not_found');
    expect(depart({ ...aTrip, status: 'cancelled' }, DRIVER, DEPART)).toBe('trips.wrong_status');
    expect(depart(aTrip, DRIVER, aTrip.endsAt)).toBe('trips.wrong_status');
    expect(depart(aTrip, DRIVER, DEPART - HOUR - 1)).toBe('trips.too_early_to_depart');
    expect(depart(aTrip, DRIVER, DEPART - HOUR)).toMatchObject({ departedAt: DEPART - HOUR });
    expect(depart({ ...aTrip, status: 'full' }, DRIVER, DEPART + HOUR)).toMatchObject({
      departedAt: DEPART + HOUR,
    });
    const left = { ...aTrip, departedAt: DEPART - 10 * MINUTE };
    expect(depart(left, DRIVER, DEPART)).toBe('trips.already_departed');
  });

  it('puts the trip on the road at once: no cancel and no new time after it', () => {
    const left = depart(aTrip, DRIVER, DEPART - 30 * MINUTE);
    if (typeof left === 'string') throw new Error(left);
    expect(cancel(left, DRIVER, DEPART - 20 * MINUTE)).toBe('trips.wrong_status');
    expect(retime(left, DRIVER, DEPART + 30 * MINUTE, DEPART - 20 * MINUTE, SHIFT)).toBe(
      'trips.wrong_status',
    );
    expect(cancel(aTrip, DRIVER, DEPART - 20 * MINUTE)).toMatchObject({ status: 'cancelled' });
  });
});

describe('«Yetib keldik» of the driver (G63, docs/35)', () => {
  it('works only on the road, once, and keeps the deadlines after the trip', () => {
    expect(arrive(aTrip, DRIVER + 1, DEPART + HOUR)).toBe('trips.not_found');
    expect(arrive(aTrip, DRIVER, DEPART - MINUTE)).toBe('trips.not_departed');
    expect(arrive({ ...aTrip, status: 'cancelled' }, DRIVER, DEPART + HOUR)).toBe('trips.wrong_status');
    const left = { ...aTrip, departedAt: DEPART - 30 * MINUTE };
    const arrived = arrive(left, DRIVER, DEPART + 4 * HOUR);
    expect(arrived).toMatchObject({ departedAt: DEPART - 30 * MINUTE, arrivedAt: DEPART + 4 * HOUR });
    expect(arrived).toMatchObject({ endsAt: aTrip.endsAt, status: 'active' });
    if (typeof arrived === 'string') return;
    expect(arrive(arrived, DRIVER, DEPART + 5 * HOUR)).toBe('trips.already_arrived');
  });

  it('counts the time of the trip as the departure when «Yoʻlga chiqdim» was not pressed', () => {
    expect(arrive(aTrip, DRIVER, DEPART + 5 * HOUR)).toMatchObject({
      departedAt: DEPART,
      arrivedAt: DEPART + 5 * HOUR,
    });
  });
});
