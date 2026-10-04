import { describe, expect, it } from 'vitest';
import { botEnv, botSender, fakeTelegram } from './test-bot';

// A broken step (D1 down, Telegram slow) still answers 200: Telegram would send the update again
// and the team would get the same support message twice (G42, docs/111).
const broken = new Proxy({} as D1Database, {
  get: () => () => {
    throw new Error('D1 is down');
  },
});

describe('a webhook with a broken step', () => {
  it('answers 200 and nothing to do', async () => {
    const send = botSender(fakeTelegram().fetch);
    const update = { message: { message_id: 1, text: 'Salom', chat: { id: 42 }, from: { id: 5 } } };
    for (const role of ['support', 'passenger', 'admin']) {
      const response = await send(role, update, 'hook', { ...botEnv, DB: broken });
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({});
    }
  });
});
