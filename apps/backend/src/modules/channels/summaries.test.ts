import type { Trip } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import type { Card } from '../notifications';
import { sendSummaries, type SummaryDeps } from './application/summaries';
import { PLACES, TRIP } from './channels-fixtures';
import { dayCard, weekCard } from './infrastructure/summary-text';

const HOUR = 3_600_000;
const SAMARQAND = { username: 'ch_samarqand', title: 'Samarqand', places: ['1718'] };
const site = { bot: 'test_bot', domain: 'site.test', pageOf: () => '/yonalish/toshkent-samarqand/' };
// Thursday 1.10.2026 22:10 and Monday 5.10.2026 10:10 in Tashkent.
const EVENING = Date.parse('2026-10-01T17:10:00Z');
const MONDAY = Date.parse('2026-10-05T05:10:00Z');
const trip = (id: string, change: Partial<Trip>): Trip => ({ ...TRIP, id, ...change });
// Two trips arrived (2 and 3 people with the driver), one still ahead; tomorrow one trip.
const TODAY = [
  trip('a', { status: 'completed', seatsLeft: 3 }),
  trip('b', { status: 'completed', seatsLeft: 2 }),
  trip('c', { seatsLeft: 4 }),
  trip('d', { status: 'cancelled', seatsLeft: 0 }),
];
const TOMORROW = [trip('e', {})];

// The summaries of a channel (G68, docs/122, mockup g68/5 «Kun va hafta yakuni»).
describe('the summaries of a channel (G68)', () => {
  it('the day at 22:00 without sound: trips, people who arrived, seats booked, tomorrow', () => {
    const card = dayCard(site)(SAMARQAND, TODAY, TOMORROW, EVENING);
    expect(card?.text.split('\n').map((line) => line.replace(/\s/gu, ' '))).toEqual([
      '<b>🌙 Kun yakuni: 1-oktabr</b>',
      '<blockquote>🚗 <b>3</b> ta safar · 👥 <b>5</b> kishi yetib bordi',
      '💺 <b>3</b> ta boʻsh joy band boʻldi</blockquote>',
      'Ertaga allaqachon <b>1</b> ta safar bor.',
    ]);
    expect(card).toMatchObject({ chatId: '@ch_samarqand', key: 'day:2026-10-01', once: true });
    expect(card?.loud).toBeUndefined();
    expect(JSON.stringify(card?.markup)).toContain('🔎 Ertangi safarlar');
    expect(dayCard(site)(SAMARQAND, [], TOMORROW, EVENING)).toBeNull();
  });

  it('the week on Monday with sound and the picture: trips, people, the rating of drivers', () => {
    const rated = { ...TRIP.driver, rating: { average: 4.75, count: 9 } };
    const week = [...TODAY, trip('f', { status: 'completed', seatsLeft: 0, driver: rated })];
    const card = weekCard(site)(SAMARQAND, week, MONDAY);
    expect(card?.text.split('\n').map((line) => line.replace(/\s/gu, ' '))).toEqual([
      '<b>📊 Hafta: Samarqand yoʻnalishi</b>',
      '<blockquote>🚗 <b>3</b> safar · 👥 <b>10</b> kishi',
      '⭐ Haydovchilar oʻrtacha <b>4,8</b></blockquote>',
      'Rahmat, yoʻl bir boʻlsin! 🤝',
    ]);
    expect(card).toMatchObject({ key: 'week:2026-10-05', once: true, loud: true });
    expect(card?.preview).toBe('https://site.test/yonalish/toshkent-samarqand/');
    expect(JSON.stringify(card?.markup)).toContain('📤 Doʻstlarga ulashish');
  });
});

function setup(now: number) {
  const shown: Card[] = [];
  const asked: string[] = [];
  const deps: SummaryDeps = {
    enabled: true,
    channels: async () => [SAMARQAND],
    places: async () => PLACES,
    tripsOf: async (date) => (asked.push(date), date === '2026-10-02' ? TOMORROW : TODAY),
    day: dayCard(site),
    week: weekCard(site),
    show: async (cards) => void shown.push(...cards),
    now: () => now,
  };
  return { deps, shown, asked };
}

describe('sending the summaries (G68)', () => {
  it('the day from 22:00, the week on Monday from 10:00 over the 7 days before', async () => {
    const noon = setup(EVENING - 10 * HOUR);
    await sendSummaries(noon.deps);
    expect(noon.shown).toEqual([]);
    const evening = setup(EVENING);
    await sendSummaries(evening.deps);
    expect(evening.shown.map((card) => card.key)).toEqual(['day:2026-10-01']);
    const monday = setup(MONDAY);
    await sendSummaries(monday.deps);
    expect(monday.shown.map((card) => card.key)).toEqual(['week:2026-10-05']);
    expect(monday.asked).toEqual([
      '2026-09-28',
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
    ]);
  });
});
