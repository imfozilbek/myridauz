import {
  ADMIN_NAVBAT_PATH,
  adminSupportAnswerPath,
  adminSupportPath,
  navbatSchema,
  supportCaseSchema,
} from '@platform/contracts';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { fakeTelegram } from './bots/test-bot';
import { assignTo } from './modules/assignments';
import { recordSupport } from './modules/support';
import { call, pid, registerUser, testEnv } from './test-api';

const telegram = fakeTelegram();
vi.stubGlobal('fetch', telegram.fetch);
afterAll(() => vi.unstubAllGlobals());

const PERSON = 61;
const OWNER = 900;
const SUPPORT = { SUPPORT_BOT_TOKEN: '4:support' };
const team = { app: 'admin', env: SUPPORT };
const answer = (text: string) => ({
  ...team,
  method: 'POST',
  body: JSON.stringify({ text }),
  headers: { 'content-type': 'application/json' },
});

// A question of support as a case of «Navbat» (G75, docs/158 К): the team reads the talk and answers
// from the admin app; the person gets it from the support bot as «Operator N».
describe('a support case in the admin app', () => {
  it('shows the talk and sends the answer from the support bot, then the case is closed', async () => {
    await registerUser(PERSON);
    await assignTo(testEnv, 'support', PERSON);
    const asked = {
      personId: PERSON,
      at: Date.now(),
      author: 'person' as const,
      name: 'Ali',
      kind: 'text' as const,
    };
    await recordSupport(testEnv, { ...asked, text: 'Pulim qaytmadi' });
    const id = await pid(PERSON);
    const opened = supportCaseSchema.parse(await (await call(adminSupportPath(id), OWNER, team)).json());
    expect(opened).toMatchObject({
      name: 'Ali',
      appeal: false,
      talk: [{ author: 'person', text: 'Pulim qaytmadi' }],
    });
    expect((await call(adminSupportAnswerPath(id), OWNER, answer('Tekshiramiz'))).status).toBe(204);
    const sent = telegram.sentTo(PERSON).find((one) => one.token === '4:support');
    expect(String(sent?.body.text)).toContain('Tekshiramiz');
    const after = supportCaseSchema.parse(await (await call(adminSupportPath(id), OWNER, team)).json());
    expect(after.talk.at(-1)).toMatchObject({ author: 'team', text: 'Tekshiramiz' });
    expect(after.talk.at(-1)?.name).toMatch(/Operator/u);
    const queue = navbatSchema.parse(await (await call(ADMIN_NAVBAT_PATH, OWNER, team)).json());
    expect(queue.items.some((item) => item.kind === 'support' && item.id === id)).toBe(false);
  });

  it('refuses an empty answer, an unknown person and anybody out of the team', async () => {
    const id = await pid(PERSON);
    expect((await call(adminSupportAnswerPath(id), OWNER, answer('  '))).status).toBe(400);
    expect((await call(adminSupportPath('f'.repeat(32)), OWNER, team)).status).toBe(404);
    expect((await call(adminSupportPath(id), PERSON)).status).toBe(403);
  });
});
