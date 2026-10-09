import { loadBrand } from '@platform/brands';
import type { Card } from '../notifications';
import { tashkentDayStart } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { emptyApplication } from './domain/application';
import { telegramNotifier } from './infrastructure/telegram-notifier';

const HOUR_MS = 60 * 60 * 1000;
const DAY = tashkentDayStart('2026-10-02');

// After the application is sent, the driver bot says when the answer comes (G34), in the card of
// the application (G68, docs/122).
describe('the driver bot after an application is sent', () => {
  const sent = async (hour: number) => {
    const shown: Card[] = [];
    const notifier = telegramNotifier({
      fetch: async () => new Response(JSON.stringify({ ok: true, result: {} })),
      brand: loadBrand(),
      adminToken: undefined,
      show: async (cards) => void shown.push(...cards),
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
    return shown;
  };

  it('in team hours: the card of the application, on check, the team checks it within the hour', async () => {
    const [card] = await sent(10);
    expect(card).toMatchObject({ bot: 'driver', chatId: 31, key: 'application:31' });
    expect(card?.text.split('\n').slice(0, 2)).toEqual([
      '<b>🪪 Haydovchi arizangiz</b>',
      '✅ Yuborildi · ⏳ Tekshirilmoqda · Javob',
    ]);
    expect(card?.text).toContain(
      'Arizangiz qabul qilindi. Jamoamiz uni 1 soat ichida tekshiradi va natijani shu yerga yozadi.',
    );
  });

  it('at night and before 7:00: the answer comes in the morning, with the team hours', async () => {
    for (const hour of [2, 6, 23]) {
      const text = (await sent(hour))[0]?.text;
      expect(text).toContain('soat 7:00 dan 23:00 gacha tekshiramiz');
      expect(text).toContain('ertalab javob beramiz');
    }
  });
});
