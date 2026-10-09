import { describe, expect, it } from 'vitest';
import { queueOf } from './domain/queue';

const HOURS = { from: 7, to: 23 };
const MINUTE = 60_000;
// 2026-10-01 10:00 in Tashkent.
const NOW = Date.parse('2026-10-01T05:00:00Z');

// «Navbat» counts the work of each kind and finds the case that waits longest (G68, docs/122).
describe('the queue of the team', () => {
  it('counts the kinds and finds the oldest case in team minutes', () => {
    const queue = queueOf(
      [
        { kind: 'face', name: 'Bobur', since: NOW - 5 * MINUTE },
        { kind: 'application', name: 'Jasur', since: NOW - 25 * MINUTE },
        { kind: 'complaint', name: 'Madina', since: NOW - 10 * MINUTE },
        { kind: 'face', name: 'Laylo', since: NOW - MINUTE },
      ],
      NOW,
      HOURS,
    );
    expect(queue.counts).toEqual({ application: 1, complaint: 1, face: 2 });
    expect(queue.total).toBe(4);
    expect(queue.oldest).toMatchObject({ item: { name: 'Jasur' }, minutes: 25 });
  });

  it('does not count the night: a case of 02:00 waits from 07:00', () => {
    const night = Date.parse('2026-09-30T21:00:00Z');
    expect(queueOf([{ kind: 'application', name: 'Jasur', since: night }], NOW, HOURS).oldest?.minutes).toBe(
      180,
    );
    expect(queueOf([], NOW, HOURS)).toEqual({
      counts: { application: 0, complaint: 0, face: 0 },
      total: 0,
      oldest: null,
    });
  });
});
