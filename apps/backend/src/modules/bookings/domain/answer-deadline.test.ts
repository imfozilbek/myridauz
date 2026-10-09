import { HOUR_MS, tashkentDayStart } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { answerDeadline } from './answer-deadline';

// A moment of a Tashkent day: "2026-10-12", 23.5 is 23:30.
const at = (date: string, hours: number) => tashkentDayStart(date) + hours * HOUR_MS;
const FAR = at('2026-10-20', 9);
// The brand's hours to answer (docs/35).
const HOURS = 24;

describe('the time the driver has to answer a request (docs/35, docs/127)', () => {
  it('is 24 hours in the day', () => {
    expect(answerDeadline(FAR, at('2026-10-12', 10), HOURS)).toBe(at('2026-10-13', 10));
  });

  it('never runs after the departure', () => {
    const departAt = at('2026-10-12', 15);
    expect(answerDeadline(departAt, at('2026-10-12', 10), HOURS)).toBe(departAt);
  });

  it('ending at night, moves to 08:00: the driver sleeps and the bot is silent (docs/124, docs/127)', () => {
    expect(answerDeadline(FAR, at('2026-10-12', 23.5), HOURS)).toBe(at('2026-10-14', 8));
    expect(answerDeadline(FAR, at('2026-10-12', 3), HOURS)).toBe(at('2026-10-13', 8));
    expect(answerDeadline(FAR, at('2026-10-12', 22), HOURS)).toBe(at('2026-10-14', 8));
  });

  it('at 08:00 or later stays as it is', () => {
    expect(answerDeadline(FAR, at('2026-10-12', 8), HOURS)).toBe(at('2026-10-13', 8));
    expect(answerDeadline(FAR, at('2026-10-12', 21.5), HOURS)).toBe(at('2026-10-13', 21.5));
  });

  it('a night departure stays the end: no answer after the trip has left', () => {
    const departAt = at('2026-10-13', 6);
    expect(answerDeadline(departAt, at('2026-10-12', 23), HOURS)).toBe(departAt);
  });
});
