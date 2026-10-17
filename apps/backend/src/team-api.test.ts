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

  // G84: a colleague sends the owner the Telegram ID; the list still shows the public id only.
  it('lets the owner add a registered person by the Telegram ID a colleague sent', async () => {
    const colleague = 63;
    const stranger = add('64');
    expect((await call(ADMIN_TEAM_PATH, OWNER, stranger)).status).toBe(404);
    await registerUser(colleague);
    expect((await call(ADMIN_TEAM_PATH, OWNER, add(String(colleague)))).status).toBe(204);
    expect(await teamRole(testEnv, colleague)).toBe('moderator');
    const raw = await (await call(ADMIN_TEAM_PATH, OWNER, team())).text();
    const list = teamListSchema.parse(JSON.parse(raw));
    expect(list.members.map((member) => member.id)).toContain(await pid(colleague));
    // The raw answer, not the parsed one: no number or string of the Telegram ID outside a hex id.
    expect(raw).not.toMatch(new RegExp(`(^|[^0-9a-f])${colleague}([^0-9a-f]|$)`, 'u'));
  });

  it("is the owner's only: a moderator neither reads nor changes the team", async () => {
    await registerUser(OTHER);
    expect((await call(ADMIN_TEAM_PATH, OWNER, add(await pid(OTHER)))).status).toBe(204);
    expect((await call(ADMIN_TEAM_PATH, OTHER, team())).status).toBe(403);
    expect((await call(ADMIN_TEAM_PATH, OTHER, add(await pid(PERSON)))).status).toBe(403);
    expect(await teamRole(testEnv, PERSON)).toBeNull();
  });
});
