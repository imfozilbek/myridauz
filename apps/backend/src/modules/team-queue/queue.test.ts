import { describe, expect, it } from 'vitest';
import { queueOf } from './domain/queue';

const HOURS = { from: 7, to: 23 };
const MINUTE = 60_000;
// 2026-10-01 10:00 in Tashkent.
const NOW = Date.parse('2026-10-01T05:00:00Z');
const CAR = { make: 'Chevrolet', model: 'Cobalt', plate: '01A123BC' };

// «Navbat» counts the work of each kind and finds the case that waits longest (G68, docs/122); the
// questions of the support bot are cases too (G75).
describe('the queue of the team', () => {
  it('counts the kinds and finds the oldest case in team minutes', () => {
    const queue = queueOf(
      [
        { kind: 'face', id: 'p1', name: 'Bobur', since: NOW - 5 * MINUTE },
        { kind: 'application', id: 'p2', name: 'Jasur', since: NOW - 25 * MINUTE, car: CAR },
        {
          kind: 'complaint',
          id: 'c1',
          name: 'Madina',
          since: NOW - 10 * MINUTE,
          against: 'Jasur',
          reasons: ['no_show'],
          refund: false,
        },
        { kind: 'face', id: 'p3', name: 'Laylo', since: NOW - MINUTE },
        { kind: 'support', id: 'p4', name: 'Aziz', since: NOW - 2 * MINUTE, appeal: false },
      ],
      NOW,
      HOURS,
    );
    expect(queue.counts).toEqual({ application: 1, complaint: 1, face: 2, support: 1 });
    expect(queue.total).toBe(5);
    expect(queue.oldest).toMatchObject({ item: { name: 'Jasur' }, minutes: 25 });
  });

  it('does not count the night: a case of 02:00 waits from 07:00', () => {
    const night = Date.parse('2026-09-30T21:00:00Z');
    const late = { kind: 'application' as const, id: 'p2', name: 'Jasur', since: night, car: CAR };
    expect(queueOf([late], NOW, HOURS).oldest?.minutes).toBe(180);
    expect(queueOf([], NOW, HOURS)).toEqual({
      counts: { application: 0, complaint: 0, face: 0, support: 0 },
      total: 0,
      oldest: null,
    });
  });
});
