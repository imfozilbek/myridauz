import { afterAll, describe, expect, it, vi } from 'vitest';
import { fakeTelegram } from './bots/test-bot';
import { sendCaseReminders } from './modules/assignments';
import { changeModerator } from './modules/team';
import { call, registerUser, testEnv } from './test-api';

const telegram = fakeTelegram();
vi.stubGlobal('fetch', telegram.fetch);
// 2026-10-02 10:00 in Tashkent: team hours.
const MORNING = Date.parse('2026-10-02T05:00:00Z');
const MINUTE = 60 * 1000;
vi.useFakeTimers({ toFake: ['Date'] });
vi.setSystemTime(MORNING);
afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const PASSENGER = 897;
const OWNER = 900;
const MODERATOR = 951;
const jpeg = { body: new Uint8Array(20), headers: { 'content-type': 'image/jpeg' } };
const adminTexts = () =>
  telegram.calls
    .filter((item) => item.token === testEnv.ADMIN_BOT_TOKEN && item.method === 'sendMessage')
    .map((item) => ({ chat: item.body.chat_id, text: String(item.body.text) }));

// G89 A5 (owner decision 20.10.2026): every case of «Navbat» rings as an application does (G34): the
// team at 25 team minutes, the owner at 30, once each. A photo has no member: the whole team hears it.
describe('a photo nobody checked', () => {
  it('rings every member at 25 minutes and the owner at 30, once each', async () => {
    await changeModerator(testEnv, OWNER, MODERATOR, true);
    await registerUser(PASSENGER);
    expect((await call('/me/avatar', PASSENGER, { method: 'PUT', ...jpeg })).status).toBeLessThan(300);
    telegram.calls.length = 0;
    for (const minutes of [20, 25, 30, 40]) {
      vi.setSystemTime(MORNING + minutes * MINUTE);
      await sendCaseReminders(testEnv);
    }
    const late = adminTexts().filter((sent) => sent.text.startsWith('⏱'));
    expect(late.map((sent) => sent.chat).sort()).toEqual([OWNER, MODERATOR].sort());
    expect(late[0]?.text).toBe('⏱ Ali rasmi 25 daqiqa kutmoqda: 5 daqiqa qoldi');
    const owner = adminTexts().filter((sent) => sent.text.startsWith('⚠️'));
    expect(owner).toEqual([{ chat: OWNER, text: '⚠️ Ali rasmi 30 daqiqadan beri koʻrilmadi.' }]);
  });
});
