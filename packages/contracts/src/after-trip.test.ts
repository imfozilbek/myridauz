import { describe, expect, it } from 'vitest';
import { afterTrip } from './after-trip';
import { HOUR_MS } from './tashkent-time';
import { arrivalAt } from './trips';

const DEPART = Date.parse('2026-10-07T08:00:00+05:00');
const KM = 300;
const TRIP = { departAt: DEPART, departUntil: null, km: KM };
// The brand defaults (docs/127 §6, §7).
const RULES = { chat: { afterTripHours: 24 }, ratings: { days: 7 }, complaints: { days: 7 } };

describe('what may be done after a trip (docs/129)', () => {
  it('writes for a day after the arrival of the road', () => {
    expect(afterTrip(RULES, TRIP).talkUntil).toBe(arrivalAt(DEPART, KM) + 24 * HOUR_MS);
  });

  it('counts the day from «Yetib keldik» when the car came (mockup g63/5 phone 5: «ertaga 12:55 gacha»)', () => {
    const arrivedAt = Date.parse('2026-10-07T12:55:00+05:00');
    const { talkUntil, rateUntil } = afterTrip(RULES, { ...TRIP, arrivedAt });
    expect(talkUntil).toBe(arrivedAt + 24 * HOUR_MS);
    // The other deadlines stay with the end of the trip, as the server closes it.
    expect(rateUntil).toBe(afterTrip(RULES, TRIP).rateUntil);
  });

  it('follows the owner: a shorter chat and a longer time to rate (G75, docs/128 §4)', () => {
    const owner = { ...RULES, chat: { afterTripHours: 6 }, ratings: { days: 14 } };
    const { talkUntil, rateUntil } = afterTrip(owner, TRIP);
    expect(talkUntil).toBe(arrivalAt(DEPART, KM) + 6 * HOUR_MS);
    expect(rateUntil - afterTrip(RULES, TRIP).rateUntil).toBe(7 * 24 * HOUR_MS);
  });

  it('counts from the last hour of a range (docs/216)', () => {
    const range = { ...TRIP, departUntil: DEPART + 2 * HOUR_MS };
    expect(afterTrip(RULES, range).talkUntil).toBe(arrivalAt(DEPART + 2 * HOUR_MS, KM) + 24 * HOUR_MS);
    expect(afterTrip(RULES, range).rateUntil - afterTrip(RULES, TRIP).rateUntil).toBe(2 * HOUR_MS);
  });
});
