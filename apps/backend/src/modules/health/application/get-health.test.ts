import { describe, expect, it } from 'vitest';
import { getHealth } from './get-health';

describe('getHealth', () => {
  it('uses the time from the clock', () => {
    const clock = { now: () => new Date('2026-09-28T10:00:00.000Z') };
    expect(getHealth(clock).time).toBe('2026-09-28T10:00:00.000Z');
  });
});
