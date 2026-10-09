import { ADMIN_TEAM_PATH, adminTeamMemberPath, teamListSchema } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { teamRole } from './modules/team';
import { call, pid, registerUser, testEnv } from './test-api';

const OWNER = 900;
const PERSON = 61;
const OTHER = 62;
const team = (init: RequestInit = {}) => ({ app: 'admin', ...init });
const add = (person: string) =>
  team({ method: 'POST', body: JSON.stringify({ person }), headers: { 'content-type': 'application/json' } });

// «Jamoa» in the admin app (G75, docs/120, docs/50): the owner adds and removes moderators by the
// public id; nobody else may; the admin bot no longer does it.
describe('«Jamoa»', () => {
  it('lets the owner add a registered person by the public id, list and remove them', async () => {
    await registerUser(PERSON);
    const person = await pid(PERSON);
    expect((await call(ADMIN_TEAM_PATH, OWNER, add(person))).status).toBe(204);
    expect(await teamRole(testEnv, PERSON)).toBe('moderator');
    const list = teamListSchema.parse(await (await call(ADMIN_TEAM_PATH, OWNER, team())).json());
    expect(list.members).toContainEqual({
      id: person,
      firstName: 'Ali',
      hasAvatar: false,
      role: 'moderator',
    });
    const unknown = await call(ADMIN_TEAM_PATH, OWNER, add('f'.repeat(32)));
    expect([unknown.status, await unknown.json()]).toEqual([404, { error: 'team.not_found' }]);
    expect((await call(adminTeamMemberPath(person), OWNER, team({ method: 'DELETE' }))).status).toBe(204);
    expect(await teamRole(testEnv, PERSON)).toBeNull();
  });

  it("is the owner's only: a moderator neither reads nor changes the team", async () => {
    await registerUser(OTHER);
    expect((await call(ADMIN_TEAM_PATH, OWNER, add(await pid(OTHER)))).status).toBe(204);
    expect((await call(ADMIN_TEAM_PATH, OTHER, team())).status).toBe(403);
    expect((await call(ADMIN_TEAM_PATH, OTHER, add(await pid(PERSON)))).status).toBe(403);
    expect(await teamRole(testEnv, PERSON)).toBeNull();
  });
});
