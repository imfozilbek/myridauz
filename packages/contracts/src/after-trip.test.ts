import { describe, expect, it } from 'vitest';
import { afterTrip } from './after-trip';
import { AFTER_TRIP_TALK_HOURS } from './chat';
import { HOUR_MS } from './tashkent-time';
import { arrivalAt } from './trips';

const DEPART = Date.parse('2026-10-07T08:00:00+05:00');
const KM = 300;

describe('what may be done after a trip (docs/129)', () => {
  it('writes for a day after the arrival of the road', () => {
    expect(afterTrip(DEPART, KM).talkUntil).toBe(arrivalAt(DEPART, KM) + AFTER_TRIP_TALK_HOURS * HOUR_MS);
  });

  it('counts the day from «Yetib keldik» when the car came (mockup g63/5 phone 5: «ertaga 12:55 gacha»)', () => {
    const arrivedAt = Date.parse('2026-10-07T12:55:00+05:00');
    const { talkUntil, rateUntil } = afterTrip(DEPART, KM, arrivedAt);
    expect(talkUntil).toBe(arrivedAt + AFTER_TRIP_TALK_HOURS * HOUR_MS);
    // The other deadlines stay with the end of the trip, as the server closes it.
    expect(rateUntil).toBe(afterTrip(DEPART, KM).rateUntil);
  });
});
