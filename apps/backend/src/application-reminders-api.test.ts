import { afterAll, describe, expect, it, vi } from 'vitest';
import { fakeTelegram } from './bots/test-bot';
import { sendApplicationReminders } from './modules/assignments';
import { waitingApplications } from './modules/drivers';
import { changeModerator } from './modules/team';
import { call, pid, registerUser, testEnv } from './test-api';

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

const APPLICANT = 41;
const OWNER = 900;
const MODERATOR = 950;
const jpeg = { body: new Uint8Array(20), headers: { 'content-type': 'image/jpeg' } };
const car = { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01 A 123 BC', seats: 4 };

async function apply(id: number) {
  await registerUser(id);
  await call('/me/avatar', id, { method: 'PUT', ...jpeg });
  for (const kind of ['front', 'side', 'interior'])
    await call(`/driver/application/photos/${kind}`, id, { method: 'PUT', app: 'driver', ...jpeg });
  const body = JSON.stringify(car);
  const headers = { 'content-type': 'application/json' };
  return call('/driver/application', id, { method: 'POST', app: 'driver', body, headers });
}

const remindAt = async (minutes: number) => {
  vi.setSystemTime(MORNING + minutes * MINUTE);
  await sendApplicationReminders(testEnv, () => waitingApplications(testEnv));
};
const adminTexts = () =>
  telegram.calls
    .filter((item) => item.token === testEnv.ADMIN_BOT_TOKEN && item.method === 'sendMessage')
    .map((item) => ({ chat: item.body.chat_id, text: String(item.body.text) }));

describe('the team answers a driver application within the hour (G34)', () => {
  it('tells the driver, reminds the moderator at 30 minutes and the owner at 50, once each', async () => {
    await changeModerator(testEnv, OWNER, MODERATOR, true);
    expect((await apply(APPLICANT)).status).toBe(200);
    const received = telegram.calls.find((item) => item.token === testEnv.DRIVER_BOT_TOKEN);
    expect(received?.body).toMatchObject({ chat_id: APPLICANT, text: expect.stringContaining('1 soat') });
    const assignee = adminTexts()[0]?.chat;
    expect([OWNER, MODERATOR]).toContain(assignee);
    telegram.calls.length = 0;
    for (const minutes of [20, 30, 40, 50, 60]) await remindAt(minutes);
    expect(adminTexts()).toEqual([
      { chat: assignee, text: '⏰ Ariza 30 daqiqadan beri kutmoqda: Ali.' },
      {
        chat: OWNER,
        text: expect.stringMatching(/^⚠️ Ariza 50 daqiqadan beri tekshirilmadi: Ali\. Moderator: /u),
      },
    ]);
    const button = telegram.calls[0]?.body.reply_markup as {
      inline_keyboard: { web_app: { url: string } }[][];
    };
    expect(button.inline_keyboard[0]?.[0]?.web_app.url).toMatch(
      new RegExp(`^https://admin\\..+/\\?application=${await pid(APPLICANT)}$`, 'u'),
    );
  });
});
