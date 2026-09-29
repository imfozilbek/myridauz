import { afterEach, describe, expect, it, vi } from 'vitest';
import { deliver } from './application/deliver';
import type { NotificationJob } from './application/job';
import { consumeNotifications, handleAfterSent, notify, notifyTeam } from '.';

const TOKENS = { passenger: 'p', driver: 'd', admin: 'a' };
const JOB: NotificationJob = { bot: 'driver', chatId: 5, text: 'Yangi xabar' };
const answer = (status: number, body: object) => async () => Response.json(body, { status });

afterEach(() => vi.unstubAllGlobals());

describe('bot messages through the queue (docs/03)', () => {
  it('sends with the bot of the person and gives the message id', async () => {
    const urls: string[] = [];
    const fetch = async (input: string) => {
      urls.push(input);
      return Response.json({ ok: true, result: { message_id: 9 } });
    };
    expect(await deliver(fetch, TOKENS, JOB)).toEqual({ outcome: 'sent', messageId: 9 });
    expect(urls).toEqual(['https://api.telegram.org/botd/sendMessage']);
  });

  it('edits a channel post by its id', async () => {
    const calls: { url: string; body: Record<string, unknown> }[] = [];
    const fetch = async (input: string, init?: RequestInit) => {
      calls.push({ url: input, body: JSON.parse(String(init?.body)) as Record<string, unknown> });
      return Response.json({ ok: true, result: {} });
    };
    const post = { bot: 'passenger' as const, chatId: '@ch_buxoro', text: 'Joy qolmagan', edit: 31 };
    expect(await deliver(fetch, TOKENS, post)).toEqual({ outcome: 'sent', messageId: null });
    expect(calls).toEqual([
      {
        url: 'https://api.telegram.org/botp/editMessageText',
        body: { chat_id: '@ch_buxoro', text: 'Joy qolmagan', message_id: 31 },
      },
    ]);
  });

  it('waits when Telegram asks to, and drops what can never be sent', async () => {
    expect(await deliver(answer(429, { parameters: { retry_after: 7 } }), TOKENS, JOB)).toEqual({
      outcome: 'retry',
      afterSeconds: 7,
    });
    expect(await deliver(answer(502, {}), TOKENS, JOB)).toEqual({ outcome: 'retry', afterSeconds: 5 });
    expect(await deliver(answer(403, {}), TOKENS, JOB)).toEqual({ outcome: 'drop' });
    expect(await deliver(answer(200, {}), { ...TOKENS, driver: undefined }, JOB)).toEqual({
      outcome: 'drop',
    });
    const offline = async () => Promise.reject(new Error('offline'));
    expect(await deliver(offline, TOKENS, JOB)).toEqual({ outcome: 'retry', afterSeconds: 5 });
  });

  it('puts jobs in the queue when there is one, and acks or retries each message', async () => {
    const queued: unknown[] = [];
    const env = { NOTIFICATIONS: { sendBatch: async (batch: unknown[]) => void queued.push(...batch) } };
    await notify(env as never, [JOB]);
    await notify(env as never, []);
    expect(queued).toEqual([{ body: JOB }]);
    vi.stubGlobal('fetch', answer(429, { parameters: { retry_after: 3 } }));
    const done: string[] = [];
    const message = {
      body: JOB,
      ack: () => done.push('ack'),
      retry: (options: { delaySeconds: number }) => done.push(`retry ${options.delaySeconds}`),
    };
    const envWithTokens = { DRIVER_BOT_TOKEN: 'd' };
    await consumeNotifications({ messages: [message] } as never, envWithTokens);
    vi.stubGlobal('fetch', answer(200, { result: { message_id: 4 } }));
    await consumeNotifications({ messages: [message] } as never, envWithTokens);
    expect(done).toEqual(['retry 3', 'ack']);
  });

  it('remembers the confirmation message once it is sent, and reaches the whole team', async () => {
    const remembered: string[] = [];
    handleAfterSent(async (_env, after, messageId) => {
      if (after.type === 'pickup') remembered.push(`${after.bookingId} ${messageId}`);
    });
    const chats: unknown[] = [];
    vi.stubGlobal('fetch', async (_input: string, init?: RequestInit) => {
      chats.push((JSON.parse(String(init?.body)) as { chat_id: number }).chat_id);
      return Response.json({ ok: true, result: { message_id: 12 } });
    });
    const env = { PASSENGER_BOT_TOKEN: 'p', ADMIN_BOT_TOKEN: 'a', ADMIN_TELEGRAM_IDS: '900,901' };
    await notify(env, [
      { bot: 'passenger', chatId: 3, text: 'ok', after: { type: 'pickup', bookingId: 'b1' } },
    ]);
    expect(remembered).toEqual(['b1 12']);
    await notifyTeam(env, 'Diqqat');
    expect(chats).toEqual([3, 900, 901]);
  });
});
