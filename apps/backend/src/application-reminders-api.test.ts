import { afterAll, describe, expect, it, vi } from 'vitest';
import { fakeTelegram } from './bots/test-bot';
import { sendApplicationReminders } from './modules/assignments';
import { waitingApplications } from './modules/drivers';
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

// G34, G68 (docs/122): the moderator hears at 25 minutes under «Navbat», the owner at 30.
describe('the team answers a driver application within the hour (G34, G68)', () => {
  it('tells the driver, rings its moderator at 25 minutes and the owner at 30, once each', async () => {
    await changeModerator(testEnv, OWNER, MODERATOR, true);
    expect((await apply(APPLICANT)).status).toBe(200);
    const received = telegram.calls.find((item) => item.token === testEnv.DRIVER_BOT_TOKEN);
    expect(received?.body).toMatchObject({ chat_id: APPLICANT, text: expect.stringContaining('1 soat') });
    telegram.calls.length = 0;
    for (const minutes of [20, 25, 30, 40, 60]) await remindAt(minutes);
    const late = adminTexts().find((sent) => sent.text.startsWith('⏱'));
    expect([OWNER, MODERATOR]).toContain(late?.chat);
    expect(late?.text).toBe('⏱ Ali arizasi 25 daqiqa kutmoqda: 5 daqiqa qoldi');
    // The owner: a line of «Diqqat» and a ring under it (G68).
    const owner = adminTexts().filter((sent) => sent.chat === OWNER && !sent.text.startsWith('⏱'));
    expect(owner.map((sent) => sent.text)).toEqual([
      expect.stringContaining('Diqqat · bugun'),
      expect.stringMatching(/^⚠️ Ariza 30 daqiqadan beri tekshirilmadi: Ali\. Moderator: /u),
    ]);
    // The ring answers the «Navbat» card of its moderator.
    const ring = telegram.calls.find((item) => item.body.text === late?.text);
    expect(ring?.body.reply_parameters).toBeDefined();
  });
});
