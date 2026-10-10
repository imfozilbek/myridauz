import { adminPersonPath, personCardSchema } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { changeModerator } from './modules/team';
import { call, pid, registerUser, testEnv } from './test-api';

const OWNER = 900;
const MODERATOR = 953;
const PERSON = 71;
const team = { app: 'admin' };
const json = (body: unknown) => ({
  ...team,
  method: 'POST',
  body: JSON.stringify(body),
  headers: { 'content-type': 'application/json' },
});

// «Odamlar» of the owner (G75, docs/120): a person by the public id, with the block in force; a
// moderator has no «Boshqaruv».
describe('«Odamlar»', () => {
  it('opens a person by the public id with rides, complaints and the block, never the phone', async () => {
    await registerUser(PERSON);
    const id = await pid(PERSON);
    const card = personCardSchema.parse(await (await call(adminPersonPath(id), OWNER, team)).json());
    expect(card).toMatchObject({
      id,
      firstName: 'Ali',
      trips: 0,
      rides: 0,
      complaintsAgainst: 0,
      car: null,
      blocked: false,
    });
    expect(JSON.stringify(card)).not.toContain(`99890${PERSON}`);
    expect((await call(`/admin/users/${id}/block`, OWNER, json({ days: 7 }))).status).toBe(204);
    const blocked = personCardSchema.parse(await (await call(adminPersonPath(id), OWNER, team)).json());
    expect(blocked.blocked).toBe(true);
    expect(blocked.blockedUntil).toEqual(expect.any(Number));
    expect((await call(adminPersonPath('f'.repeat(32)), OWNER, team)).status).toBe(404);
  });

  it("is the owner's only", async () => {
    expect(await changeModerator(testEnv, OWNER, MODERATOR, true)).toBe('ok');
    expect((await call(adminPersonPath(await pid(PERSON)), MODERATOR, team)).status).toBe(403);
  });
});
