import { toCyrillic } from '@platform/i18n';
import { describe, expect, it } from 'vitest';
import { testD1 } from '../test-d1';
import { botEnv, botSender, fakeTelegram } from './test-bot';

// «Kerak emas» under a tip of a step (G70a, docs/232): the tips stop, the buttons leave the tip.
describe('«Kerak emas» under a tip', () => {
  it('turns the tips of the person off in the passenger and the driver bot', async () => {
    const telegram = fakeTelegram();
    const send = botSender(telegram.fetch);
    const db = testD1();
    const press = (fromId: number) => ({
      update_id: 1,
      callback_query: {
        id: 'q',
        from: { id: fromId },
        data: 'tips_off',
        message: { message_id: 5, chat: { id: fromId } },
      },
    });
    for (const [role, id] of [
      ['passenger', 11],
      ['driver', 12],
    ] as const) {
      const response = await send(role, press(id), 'hook', { ...botEnv, DB: db });
      expect(await response.json()).toMatchObject({
        method: 'answerCallbackQuery',
        text: toCyrillic('Maslahatlar oʻchirildi. Muhim xabarlar kelaveradi.'),
      });
    }
    expect(telegram.calls.map((call) => [call.token, call.method, call.body.reply_markup])).toEqual([
      ['p', 'editMessageReplyMarkup', { inline_keyboard: [] }],
      ['d', 'editMessageReplyMarkup', { inline_keyboard: [] }],
    ]);
    const off = await db.prepare('SELECT user_id AS id FROM tips_off ORDER BY user_id').all();
    expect(off.results).toEqual([{ id: 11 }, { id: 12 }]);
  });
});
