import { describe, expect, it } from 'vitest';
import { fullScans, testD1 } from '../../test-d1';
import type { Counter } from './domain/counters';
import { complaintReasonCountsOf, leavingOf, opensOf, ratingsSummaryOf } from './domain/voice';
import { d1Voice } from './infrastructure/d1-voice';

const DAY = 24 * 3600 * 1000;
const NOW = Date.parse('2026-10-18T10:00:00Z');
const counter = (name: string, app: string, code: string, sessions: number, events = sessions): Counter => ({
  name,
  app,
  code,
  sessions,
  events,
});

async function seeded() {
  const db = testD1();
  const review = (id: string, stars: number, tags: string[], at: number) =>
    db
      .prepare(
        `INSERT INTO reviews (id, booking_id, rater_id, ratee_id, stars, tags, created_at, updated_at)
         VALUES (?, ?, 1, 2, ?, ?, ?, ?)`,
      )
      .bind(id, `b${id}`, stars, JSON.stringify(tags), at, at)
      .run();
  const complaint = (id: string, reason: string, at: number) =>
    db
      .prepare(
        `INSERT INTO complaints (id, author_id, against_id, booking_id, reason, status, created_at)
         VALUES (?, 1, 2, ?, ?, 'new', ?)`,
      )
      .bind(id, `b${id}`, reason, at)
      .run();
  await review('1', 5, ['on_time', 'polite'], NOW - 1000);
  await review('2', 4, ['on_time'], NOW - 2000);
  await review('3', 1, [], NOW - 3000);
  // Older than the period: not counted.
  await review('4', 2, ['polite'], NOW - 3 * DAY);
  await complaint('1', 'unsafe_driving,price_changed', NOW - 1000);
  await complaint('2', 'price_changed', NOW - 2000);
  await complaint('3', 'no_show', NOW - 3 * DAY);
  return db;
}

// G87 (docs/191): what people feel, in numbers only.
describe('the voice of people in Statistika', () => {
  it('sums the ratings and the reasons of the complaints of the period through the time indexes', async () => {
    const db = await seeded();
    const rows = await d1Voice(db)(NOW - DAY);
    expect(ratingsSummaryOf(rows)).toEqual({
      count: 3,
      average: 3.3,
      low: 1,
      tags: [
        { tag: 'on_time', count: 2 },
        { tag: 'polite', count: 1 },
      ],
    });
    expect(complaintReasonCountsOf(rows)).toEqual([
      { reason: 'price_changed', count: 2 },
      { reason: 'unsafe_driving', count: 1 },
    ]);
    expect(fullScans(db)).toEqual([]);
  });

  it('says 0 without ratings and drops a tag that is not in the list', () => {
    const rows = { stars: { count: 0, total: 0, low: 0 }, tags: [{ tag: 'odd', count: 4 }], complaints: [] };
    expect(ratingsSummaryOf(rows)).toEqual({ count: 0, average: 0, low: 0, tags: [] });
    expect(complaintReasonCountsOf(rows)).toEqual([]);
  });

  it('counts the reasons of leaving by kind, the most given first, never an unknown one', () => {
    const counters = [
      counter('leave_reason', 'passenger', 'booking.time', 1),
      counter('leave_reason', 'passenger', 'booking.found_other', 2, 3),
      counter('leave_reason', 'driver', 'trip.no_passengers', 1),
      counter('leave_reason', 'driver', 'account.privacy', 1),
      counter('leave_reason', 'driver', 'trip.odd', 5),
    ];
    expect(leavingOf(counters)).toEqual([
      { kind: 'booking', reason: 'found_other', count: 3 },
      { kind: 'booking', reason: 'time', count: 1 },
      { kind: 'trip', reason: 'no_passengers', count: 1 },
      { kind: 'account', reason: 'privacy', count: 1 },
    ]);
  });

  it('tells the opens from a bot message, the menu and the links apart, without the team', () => {
    const counters = [
      counter('screen_open', 'passenger', 'bot', 5),
      counter('screen_open', 'driver', 'bot', 2),
      counter('screen_open', 'passenger', 'direct', 9),
      counter('screen_open', 'passenger', 'trip', 3),
      counter('screen_open', 'main', 'find', 1),
      // Not a first screen, and the app of the team: left out.
      counter('screen_open', 'passenger', '', 40),
      counter('screen_open', 'admin', 'direct', 12),
    ];
    expect(opensOf(counters)).toEqual([
      { kind: 'bot', count: 7 },
      { kind: 'direct', count: 9 },
      { kind: 'link', count: 4 },
    ]);
  });
});
