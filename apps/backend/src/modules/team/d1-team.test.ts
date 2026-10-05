import { describe, expect, it } from 'vitest';
import { fullScans, testD1 } from '../../test-d1';
import { d1Team } from './infrastructure/d1-team';

// Every signed request asks the role of the person: one row by the key, not the whole team (G56).
describe('the team in D1', () => {
  it('finds a moderator by the id', async () => {
    const db = testD1();
    const team = d1Team(db);
    await team.add(7, 900, 1);
    expect([await team.isModerator(7), await team.isModerator(8)]).toEqual([true, false]);
    await team.remove(7);
    expect(await team.isModerator(7)).toBe(false);
    expect(fullScans(db)).toEqual([]);
  });
});
