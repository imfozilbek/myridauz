import { loadBrand } from '@platform/brands';
import { DAY_MS } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { askRatings } from './application/ask';
import type { Ask, RatingsDeps, Ride } from './application/ports';
import { rate } from './application/rate';
import { ratingsOf, reviewsOf, standingOf } from './application/read';
import { ratingOf } from './domain/rating';
import { createMemoryRatings } from './infrastructure/memory-ratings';
import { idOfPublic, publicIdOf } from '../../test-people';

const NOW = Date.parse('2026-10-05T12:00:00Z');
const HOUR = 3_600_000;
const RULES = loadBrand().ratings;
const DRIVER = 1;
const ride = (n: number, over = true): Ride => ({
  bookingId: `b${n}`,
  tripId: `t${n}`,
  driverId: DRIVER,
  passengerId: 100 + n,
  endsAt: NOW - HOUR,
  over,
});

function setup(rides: Ride[] = [ride(1)]) {
  let clock = NOW;
  const asked: { ask: Ask; name: string; rater: string; reminder: boolean }[] = [];
  const alerts: { name: string; publicId: string }[] = [];
  const deps: RatingsDeps = {
    store: createMemoryRatings(),
    rides: {
      ended: async (from, to) => rides.filter((known) => known.endsAt >= from && known.endsAt < to),
      find: async (id) => rides.find((known) => known.bookingId === id),
    },
    names: async (ids) => new Map(ids.map((id) => [id, id === DRIVER ? 'Jasur' : `P${id}`])),
    people: { publicId: async (id) => publicIdOf(id), idOf: idOfPublic },
    ask: async (ask, name, { rater }, reminder) => void asked.push({ ask, name, rater, reminder }),
    alertTeam: async (person) => void alerts.push(person),
    mask: (text) => text.replace(/\+?\d{9,}/gu, '***'),
    limits: RULES,
    now: () => clock,
    newId: () => `r${Math.random()}`,
  };
  return { deps, asked, alerts, later: (ms: number) => void (clock += ms) };
}
const review = (bookingId: string, stars: number, text = '') => ({ bookingId, stars, tags: [], text });

describe('the rating of a person (docs/24)', () => {
  it('shows "Yangi" below 3 ratings and the average with one decimal after', () => {
    expect(ratingOf([5, 4], RULES)).toEqual({ average: null, count: 2 });
    expect(ratingOf([5, 5, 4], RULES)).toEqual({ average: 4.7, count: 3 });
  });

  it('asks both sides once after the ride and reminds once after 24 hours', async () => {
    const { deps, asked, later } = setup();
    await askRatings(deps);
    await askRatings(deps);
    expect(asked.map((item) => [item.ask.raterId, item.name, item.rater, item.reminder])).toEqual([
      [101, 'Jasur', 'passenger', false],
      [DRIVER, 'P101', 'driver', false],
    ]);
    await rate(deps, 101, review('b1', 5));
    later(25 * HOUR);
    await askRatings(deps);
    await askRatings(deps);
    expect(asked.slice(2).map((item) => [item.ask.raterId, item.reminder])).toEqual([[DRIVER, true]]);
  });

  it('keeps a review hidden until the other side answers or 7 days pass (G60, docs/129)', async () => {
    const { deps } = setup();
    expect(await rate(deps, 101, review('b1', 2, 'qoʻpol, +998901234567'))).toBe('ok');
    expect((await reviewsOf(deps, DRIVER)).reviews).toEqual([]);
    await rate(deps, DRIVER, review('b1', 5));
    const [shown] = (await reviewsOf(deps, DRIVER)).reviews;
    expect(shown).toMatchObject({ authorName: 'P101', stars: 2, text: 'qoʻpol, ***' });
    const other = setup();
    await rate(other.deps, 101, review('b1', 4));
    other.later(6 * DAY_MS);
    expect((await reviewsOf(other.deps, DRIVER)).reviews).toHaveLength(0);
    other.later(DAY_MS);
    expect((await reviewsOf(other.deps, DRIVER)).reviews).toHaveLength(1);
  });

  it('rates only a ride of the person that is over, within 7 days; the bot keeps the text', async () => {
    const { deps, later } = setup([ride(1), ride(2, false)]);
    expect(await rate(deps, 999, review('b1', 5))).toBe('reviews.not_found');
    expect(await rate(deps, 102, review('b2', 5))).toBe('reviews.not_over');
    await rate(deps, 101, { ...review('b1', 4, 'Yaxshi'), tags: ['on_time', 'tidy'] });
    await rate(deps, 101, review('b1', 5), true);
    expect(await deps.store.review('b1', 101)).toMatchObject({ stars: 5, text: 'Yaxshi', tags: ['on_time'] });
    later(8 * DAY_MS);
    expect(await rate(deps, 101, review('b1', 3))).toBe('reviews.too_late');
  });

  it('«vaqtida» of «Profil» is the share of published reviews marked on time (G65)', async () => {
    const { deps, later } = setup([ride(1), ride(2), ride(3)]);
    const onTime = (n: number) => ({ ...review(`b${n}`, 5), tags: ['on_time'] });
    await rate(deps, 101, onTime(1));
    await rate(deps, 102, onTime(2));
    await rate(deps, 103, review('b3', 4));
    expect(await standingOf(deps, DRIVER)).toEqual({ rating: { average: null, count: 0 }, onTime: null });
    later(7 * DAY_MS);
    expect(await standingOf(deps, DRIVER)).toEqual({ rating: { average: 4.7, count: 3 }, onTime: 67 });
  });

  it('sends a low average to a moderator once and lets the team hide a review', async () => {
    const rides = Array.from({ length: 11 }, (_, index) => ride(index + 1));
    const { deps, alerts } = setup(rides);
    for (const known of rides.slice(0, 10)) await rate(deps, known.passengerId, review(known.bookingId, 3));
    expect(alerts).toEqual([{ name: 'Jasur', publicId: publicIdOf(DRIVER) }]);
    await rate(deps, 111, review('b11', 1));
    expect(alerts).toEqual([{ name: 'Jasur', publicId: publicIdOf(DRIVER) }]);
    for (const known of rides) await rate(deps, DRIVER, review(known.bookingId, 5));
    const before = await reviewsOf(deps, DRIVER);
    expect(before.rating.count).toBe(11);
    await deps.store.hide(before.reviews[0]?.id ?? '');
    expect((await ratingsOf(deps, [DRIVER, 55])).get(55)).toEqual({ average: null, count: 0 });
    expect((await ratingsOf(deps, [DRIVER])).get(DRIVER)?.count).toBe(10);
  });
});
