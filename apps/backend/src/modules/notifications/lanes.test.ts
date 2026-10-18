import { afterEach, describe, expect, it, vi } from 'vitest';
import { testD1 } from '../../test-d1';
import { localAnalyticsRows } from '../analytics';
import type { NotificationJob } from './application/job';
import { d1Pace } from './infrastructure/pace-store';
import { consumeNotifications, notify, notifyMass, scheduleTasks } from '.';

const ok = async () => Response.json({ ok: true, result: { message_id: 4 } });
const limit = async () => Response.json({ ok: false, parameters: { retry_after: 30 } }, { status: 429 });
const job = (chatId: number | string, bot: NotificationJob['bot'] = 'passenger'): NotificationJob => ({
  bot,
  chatId,
  text: `x${String(chatId)}`,
});
const TASKS = { reminder: async () => undefined };

function world() {
  const queued: { body: unknown; delaySeconds?: number }[] = [];
  const sent: unknown[] = [];
  vi.stubGlobal('fetch', async (_input: string, init?: RequestInit) => {
    sent.push(JSON.parse(String(init?.body)).chat_id);
    return ok();
  });
  const NOTIFICATIONS = { sendBatch: async (batch: typeof queued) => void queued.push(...batch) };
  const env = {
    PASSENGER_BOT_TOKEN: 'p',
    DRIVER_BOT_TOKEN: 'd',
    POSTER_BOT_TOKEN: 'c',
    DB: testD1(),
    NOTIFICATIONS,
  };
  return { env: env as never, raw: env, queued, sent };
}

afterEach(() => vi.unstubAllGlobals());

// G85 part 2 (docs/122): the answers to people's steps go at once and first, the rest at an even pace.
describe('the lanes of the bot messages', () => {
  it('sends a few mass messages at once and spreads a big batch over seconds', async () => {
    const { env, queued, sent } = world();
    await notifyMass(env, [job(1), job(2)]);
    expect(sent).toEqual([1, 2]);
    await notifyMass(
      env,
      Array.from({ length: 45 }, (_, index) => job(index + 10)),
    );
    expect(queued.map((item) => item.delaySeconds)).toEqual([
      ...Array(20).fill(0),
      ...Array(20).fill(1),
      ...Array(5).fill(2),
    ]);
  });

  it('keeps 18 posts a minute in one channel: the next ones wait their turn', async () => {
    const { env, queued, sent } = world();
    await notifyMass(env, [job('@ch', 'poster'), job('@ch', 'poster'), job('@other', 'poster')]);
    expect(sent).toEqual(['@ch', '@other']);
    expect(queued).toEqual([{ body: job('@ch', 'poster'), delaySeconds: 4 }]);
  });

  it('makes the whole bot wait after a 429, and its next messages go to the queue', async () => {
    const { env, raw, queued, sent } = world();
    vi.stubGlobal('fetch', async (_input: string, init?: RequestInit) => {
      sent.push(JSON.parse(String(init?.body)).chat_id);
      return limit();
    });
    await notify(env, [job(1), job(2), job(3, 'driver')]);
    expect(sent).toEqual([1, 3]);
    expect(queued.map((item) => [(item.body as NotificationJob).chatId, item.delaySeconds])).toEqual([
      [1, 30],
      [2, 30],
      [3, 30],
    ]);
    // Another request sees the wait in D1 and does not call Telegram for that bot.
    vi.stubGlobal('fetch', ok);
    expect((await d1Pace(raw.DB).pauses(Date.now())).has('passenger')).toBe(true);
    await notify(env, [job(4)]);
    expect(queued.at(-1)).toEqual({ body: job(4), delaySeconds: 30 });
    const counted = localAnalyticsRows.filter(
      (row) => row.blobs[0] === 'bot_send' && row.blobs[5] === 'limited',
    );
    expect(counted.length).toBeGreaterThanOrEqual(2);
  });

  it('gives a waiting bot back to the queue without calling Telegram, and runs the timed tasks', async () => {
    const { env, raw, queued, sent } = world();
    await d1Pace(raw.DB).pause('driver', Date.now() + 10_000);
    const done: string[] = [];
    const message = (body: unknown) => ({
      body,
      attempts: 1,
      ack: () => done.push('ack'),
      retry: () => done.push('retry'),
    });
    const ran: unknown[] = [];
    const tasks = { reminder: async (_env: unknown, task: unknown) => void ran.push(task) };
    const task = { task: 'reminder', data: { tripId: 't1' } } as const;
    await consumeNotifications({ messages: [message(job(1, 'driver')), message(task)] } as never, env, tasks);
    expect(sent).toEqual([]);
    expect(done).toEqual(['ack', 'ack']);
    expect(queued).toEqual([{ body: job(1, 'driver'), delaySeconds: 10 }]);
    expect(ran).toEqual([task]);
  });

  it('holds a task until its moment in the queue, or runs it at once without the queue', async () => {
    const { env, raw, queued } = world();
    const task = { task: 'reminder', data: { tripId: 't1' } } as const;
    await scheduleTasks(env, [{ task, at: Date.now() + 600_000 }], TASKS.reminder);
    expect(queued).toEqual([{ body: task, delaySeconds: 600 }]);
    const ran: unknown[] = [];
    await scheduleTasks(
      { ...raw, NOTIFICATIONS: undefined } as never,
      [{ task, at: 0 }],
      async (one) => void ran.push(one),
    );
    expect(ran).toEqual([task]);
  });
});
