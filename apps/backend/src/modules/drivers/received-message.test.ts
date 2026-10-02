import { loadBrand } from '@platform/brands';
import { tashkentDayStart } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { emptyApplication } from './domain/application';
import { telegramNotifier } from './infrastructure/telegram-notifier';

const HOUR_MS = 60 * 60 * 1000;
const DAY = tashkentDayStart('2026-10-02');

// After the application is sent, the driver bot says when the answer comes (G34).
describe('the driver bot after an application is sent', () => {
  const sent = async (hour: number) => {
    const calls: { url: string; body: { chat_id: number; text: string } }[] = [];
    const notifier = telegramNotifier({
      fetch: async (url, init) => {
        calls.push({ url, body: JSON.parse(String(init?.body)) as { chat_id: number; text: string } });
        return new Response(JSON.stringify({ ok: true, result: {} }));
      },
      brand: loadBrand(),
      adminToken: undefined,
      driverToken: 'd',
      recipients: async () => [],
      photos: {} as never,
      people: {} as never,
    });
    const application = {
      ...emptyApplication(31, 0),
      status: 'pending' as const,
      submittedAt: DAY + hour * HOUR_MS,
    };
    await notifier.submitted(application, { avatarKey: null, firstName: 'Jasur' } as never);
    return calls;
  };

  it('in team hours: the team checks it within the hour', async () => {
    const calls = await sent(10);
    expect(calls.map((call) => call.url)).toEqual(['https://api.telegram.org/botd/sendMessage']);
    expect(calls[0]?.body).toEqual({
      chat_id: 31,
      text: 'Arizangiz qabul qilindi. Jamoamiz uni 1 soat ichida tekshiradi va natijani shu yerga yozadi.',
    });
  });

  it('at night and before 7:00: the answer comes in the morning, with the team hours', async () => {
    for (const hour of [2, 6, 23]) {
      const text = (await sent(hour))[0]?.body.text;
      expect(text).toContain('soat 7:00 dan 23:00 gacha tekshiramiz');
      expect(text).toContain('ertalab javob beramiz');
    }
  });
});
