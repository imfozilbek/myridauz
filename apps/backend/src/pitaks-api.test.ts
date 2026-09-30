import {
  ADMIN_PITAK_DIRECTIONS_PATH,
  ADMIN_PITAKS_PATH,
  adminPitaksSchema,
  PITAK_OF_DIRECTION_PATH,
  pitakOfDirectionSchema,
} from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { changeModerator } from './modules/team';
import { call, registerUser, testEnv } from './test-api';

const OWNER = 900;
const MODERATOR = 906;
const PASSENGER = 83;
const json = (method: string, body: unknown) => ({
  app: 'admin',
  method,
  body: JSON.stringify(body),
  headers: { 'content-type': 'application/json' },
});

describe('the pitaks of the admin (G24, docs/72)', () => {
  it('lets the team add a pitak and make it the main one of a direction', async () => {
    expect(await changeModerator(testEnv, OWNER, MODERATOR, true)).toBe('ok');
    const point = { lat: 41.2438, lng: 69.3394 };
    const created = await call(
      ADMIN_PITAKS_PATH,
      MODERATOR,
      json('POST', { name: 'Qoʻyliq', point, status: 'claude' }),
    );
    expect(created.status).toBe(200);
    const { id } = (await created.json()) as { id: string };
    const direction = { from: '1726', to: '1730', pitakId: id };
    expect((await call(ADMIN_PITAK_DIRECTIONS_PATH, MODERATOR, json('PUT', direction))).status).toBe(200);
    const list = adminPitaksSchema.parse(
      await (await call(ADMIN_PITAKS_PATH, MODERATOR, { app: 'admin' })).json(),
    );
    expect(list.directions).toContainEqual(direction);
    const removed = await call(`${ADMIN_PITAK_DIRECTIONS_PATH}/1726/1730`, MODERATOR, json('DELETE', {}));
    expect(removed.status).toBe(204);
  });

  it('refuses a person who is not in the team', async () => {
    await registerUser(PASSENGER);
    const response = await call(ADMIN_PITAKS_PATH, PASSENGER, { app: 'admin' });
    expect(response.status).toBe(403);
  });
});

describe('the pitak of a direction for people (G24, docs/71)', () => {
  it('answers the main pitak when people may see it, else nothing', async () => {
    await registerUser(PASSENGER);
    const ask = async (from: string, to: string) =>
      pitakOfDirectionSchema.parse(
        await (await call(`${PITAK_OF_DIRECTION_PATH}?from=${from}&to=${to}`, PASSENGER)).json(),
      );
    expect(await ask('1726', '1703')).toEqual({ pitak: null });
  });
});
