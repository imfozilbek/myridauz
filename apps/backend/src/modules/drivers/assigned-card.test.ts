import { loadBrand } from '@platform/brands';
import { describe, expect, it } from 'vitest';
import { emptyApplication } from './domain/application';
import { telegramNotifier } from './infrastructure/telegram-notifier';

// A new application goes to the one assigned team member, not to the whole team (docs/92).
describe('the card of a new application', () => {
  it('reaches only the members given for this applicant', async () => {
    const chats: unknown[] = [];
    const notifier = telegramNotifier({
      fetch: async (_url, init) => {
        chats.push((JSON.parse(String(init?.body)) as { chat_id: unknown }).chat_id);
        return new Response(JSON.stringify({ ok: true, result: {} }));
      },
      brand: loadBrand(),
      adminToken: 'a',
      show: async () => undefined,
      recipients: async (userId) => (userId === 31 ? [100] : [100, 200]),
      photos: { get: async () => undefined } as never,
      people: { avatar: async () => undefined } as never,
    });
    const application = { ...emptyApplication(31, 0), status: 'pending' as const };
    await notifier.submitted(application, { avatarKey: null, firstName: 'Jasur' } as never);
    expect(chats).toEqual([100]);
  });
});
