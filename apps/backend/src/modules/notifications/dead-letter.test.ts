import { afterEach, describe, expect, it, vi } from 'vitest';
import { testD1 } from '../../test-d1';
import { localAnalyticsRows } from '../analytics';
import { consumeNotifications, MAX_ATTEMPTS } from '.';

const JOB = { bot: 'driver', chatId: 7, text: 'Yangi soʻrov' } as const;

afterEach(() => vi.unstubAllGlobals());

// A message Telegram never took after the last try is not lost silently: it is kept for the team
// and counted on the dashboard (G42, docs/111, docs/65 D).
describe('a message after its last try', () => {
  it('goes to the dead letters, the queue lets it go', async () => {
    vi.stubGlobal('fetch', async () => new Response('{}', { status: 502 }));
    const done: string[] = [];
    const message = (attempts: number) => ({
      body: JOB,
      attempts,
      ack: () => done.push(`ack ${attempts}`),
      retry: () => done.push(`retry ${attempts}`),
    });
    const DB = testD1();
    const env = { DRIVER_BOT_TOKEN: 'd', DB };
    await consumeNotifications({ messages: [message(1), message(MAX_ATTEMPTS)] } as never, env);
    expect(done).toEqual(['retry 1', `ack ${MAX_ATTEMPTS}`]);
    const kept = await DB.prepare('SELECT bot, chat_id, text FROM dead_notifications').all();
    expect(kept.results).toEqual([{ bot: 'driver', chat_id: 7, text: 'Yangi soʻrov' }]);
    expect(localAnalyticsRows.at(-1)?.blobs[0]).toBe('server_error');
    expect(localAnalyticsRows.at(-1)?.blobs[5]).toBe('notification_dead');
  });
});
