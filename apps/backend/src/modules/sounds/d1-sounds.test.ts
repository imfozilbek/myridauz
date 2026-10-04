import { describe, expect, it } from 'vitest';
import { testD1 } from '../../test-d1';
import { d1Sounds } from './infrastructure/d1-sounds';

// The picks of the owner on SQLite with the real migrations (G54, docs/115).
describe('the sound picks in D1', () => {
  it('has no pick at first, then gives the newest with its author and time', async () => {
    const sounds = d1Sounds(testD1());
    expect(await sounds.latest()).toBeNull();
    await sounds.add('1', 900, 1000);
    await sounds.add('2', 901, 2000);
    expect(await sounds.latest()).toEqual({ set: '2', changedBy: 901, changedAt: 2000 });
  });
});
