import { ADMIN_PATHS_FILE_PATH, ADMIN_PATHS_PATH } from '@platform/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { app } from './app';
import { OWNER } from './bookings-test-api';
import { changeModerator } from './modules/team';
import { call, testEnv } from './test-api';

// G99 (docs/234): the paths by source and Telegram, and the files of the analyst for the owner only.
const MODERATOR = 906;
const SESSION = '7a1c2f7e-3c1b-4f5e-9a3d-2b8c1d0e4f5a';
const event = (name: string, extra: object = {}) => ({
  name,
  app: 'passenger',
  screen: 'home',
  at: Date.now(),
  sessionId: SESSION,
  version: '1',
  who: SESSION,
  entry: 'ad-insta9',
  tg: '6.4',
  platform: 'unigram',
  ...extra,
});
const ADMIN = { app: 'admin' };

afterEach(() => vi.unstubAllGlobals());

describe('the paths of the people (G99)', () => {
  it('shows the team a person of an ad on an old Telegram, with the errors there', async () => {
    const batch = {
      events: [
        event('screen_open'),
        event('trip_search', { code: 'found' }),
        event('client_error', { code: 'render', error: 'TypeError' }),
        // An error of before G99 has no stamp: no source or Telegram is made up for it.
        event('client_error', {
          code: 'render',
          who: undefined,
          entry: undefined,
          tg: undefined,
          platform: undefined,
        }),
      ],
    };
    await app.request('/analytics', { method: 'POST', body: JSON.stringify(batch) }, testEnv);
    const response = await call(`${ADMIN_PATHS_PATH}?period=month`, OWNER, ADMIN);
    const paths = (await response.json()) as {
      sources: { kind: string; people: number; errors: number }[];
      versions: { tg: string; people: number }[];
      platforms: { platform: string }[];
    };
    expect(paths.sources.find((row) => row.kind === 'ad')).toMatchObject({ people: 1, errors: 1 });
    expect(paths.sources.find((row) => row.kind === 'direct')).toBeUndefined();
    expect(paths.versions.find((row) => row.tg === 'old')?.people).toBe(1);
    expect(paths.platforms.map((row) => row.platform)).toContain('other');
    expect((await call(ADMIN_PATHS_PATH, 77, ADMIN)).status).toBe(403);
  });

  it('sends the two files to the owner by the admin bot; a moderator gets none', async () => {
    const sent: { method: string; file: string }[] = [];
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
      const form = init?.body as FormData;
      sent.push({ method: url.split('/').at(-1) ?? '', file: (form.get('document') as File).name });
      return Response.json({ ok: true, result: {} });
    });
    expect(await changeModerator(testEnv, OWNER, MODERATOR, true)).toBe('ok');
    const refused = await call(`${ADMIN_PATHS_FILE_PATH}?period=week`, MODERATOR, {
      ...ADMIN,
      method: 'POST',
    });
    expect(refused.status).toBe(403);
    const asked = await call(`${ADMIN_PATHS_FILE_PATH}?period=week`, OWNER, { ...ADMIN, method: 'POST' });
    expect(asked.status).toBe(204);
    expect(sent).toEqual([
      { method: 'sendDocument', file: 'paths-week.csv' },
      { method: 'sendDocument', file: 'errors-week.csv' },
    ]);
  });
});
