import { describe, expect, it } from 'vitest';
import { members, roleOf, setModerator, type Team } from './application/team';
import { createMemoryTeam } from './infrastructure/memory-team';

const OWNER = 900;
const MODERATOR = 7;
const PERSON = 8;
const teamOf = (): Team => ({ owners: new Set([OWNER]), repository: createMemoryTeam() });

// The team (docs/02, G49): the owners come from the brand secret only; an owner adds and removes the
// moderators; the list shows each member once.
describe('the team', () => {
  it('knows an owner by the secret, a moderator by the list, anyone else as nobody', async () => {
    const team = teamOf();
    await team.repository.add(MODERATOR, OWNER, 1);
    expect(await roleOf(team, OWNER)).toBe('owner');
    expect(await roleOf(team, MODERATOR)).toBe('moderator');
    expect(await roleOf(team, PERSON)).toBeNull();
  });

  it('lists an owner once, even when the list of moderators also has him', async () => {
    const team = teamOf();
    await team.repository.add(OWNER, OWNER, 1);
    await team.repository.add(MODERATOR, OWNER, 1);
    expect(await members(team)).toEqual([
      { id: OWNER, role: 'owner' },
      { id: MODERATOR, role: 'moderator' },
    ]);
  });

  it('lets only an owner make and unmake a moderator', async () => {
    const team = teamOf();
    expect(await setModerator(team, MODERATOR, PERSON, true, 1)).toBe('team.not_owner');
    expect(await roleOf(team, PERSON)).toBeNull();
    expect(await setModerator(team, OWNER, PERSON, true, 1)).toBe('ok');
    expect(await roleOf(team, PERSON)).toBe('moderator');
    expect(await setModerator(team, PERSON, OWNER, false, 2)).toBe('team.not_owner');
    expect(await setModerator(team, OWNER, PERSON, false, 2)).toBe('ok');
    expect(await roleOf(team, PERSON)).toBeNull();
  });
});
