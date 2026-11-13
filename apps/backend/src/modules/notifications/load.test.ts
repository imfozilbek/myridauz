import { afterEach, describe, expect, it, vi } from 'vitest';
import { testD1 } from '../../test-d1';
import type { NotificationJob, QueueMessage } from './application/job';
import { consumeNotifications, notify, notifyMass } from '.';

// G86 T8 (docs/122): 1000 mass messages and 50 answers at once, through the real lanes, consumer
// and D1, with the queue and Telegram as models on a clock of their own.
const T0 = Date.parse('2026-11-13T10:00:00.300Z');
// Telegram answers 429 to a bot that sent 30 messages in the last second (core.telegram.org/bots/faq).
const TELEGRAM_PER_SECOND = 30;
const STEP_MS = 100;
const END_MS = 180_000;
const BATCH = 10;
const MASS = 1000;
const ANSWERS = 50;
const P95 = 0.95;

type Waiting = { body: QueueMessage; at: number; id: string; attempts: number };

function world() {
  const queue: Waiting[] = [];
  const calls: number[] = [];
  const delivered = new Map<number, number>();
  let limited = 0;
  let ids = 0;
  vi.stubGlobal('fetch', async (_input: string, init?: RequestInit) => {
    const now = Date.now();
    if (calls.filter((at) => at > now - 1000).length >= TELEGRAM_PER_SECOND) {
      limited += 1;
      return Response.json({ ok: false, parameters: { retry_after: 1 } }, { status: 429 });
    }
    calls.push(now);
    const chat = Number((JSON.parse(String(init?.body)) as { chat_id: number }).chat_id);
    if (!delivered.has(chat)) delivered.set(chat, now);
    return Response.json({ ok: true, result: { message_id: calls.length } });
  });
  const push = (items: readonly { body: QueueMessage; delaySeconds?: number }[], attempts = 1) =>
    items.forEach((item) =>
      queue.push({ ...item, at: Date.now() + (item.delaySeconds ?? 0) * 1000, id: `m${ids++}`, attempts }),
    );
  const NOTIFICATIONS = {
    sendBatch: async (items: { body: QueueMessage; delaySeconds?: number }[]) => push(items),
  };
  const env = { PASSENGER_BOT_TOKEN: 'p', DB: testD1(), NOTIFICATIONS } as never;
  // One step of the clock: the messages due now, ten in a batch, as the consumer gets them.
  async function step() {
    const due = queue.filter((item) => item.at <= Date.now()).sort((one, other) => one.at - other.at);
    for (const item of due) queue.splice(queue.indexOf(item), 1);
    for (let start = 0; start < due.length; start += BATCH) {
      const messages = due.slice(start, start + BATCH).map((item) => ({
        id: item.id,
        body: item.body,
        attempts: item.attempts,
        ack: () => undefined,
        retry: (options?: { delaySeconds?: number }) =>
          push([{ body: item.body, ...options }], item.attempts + 1),
      }));
      await consumeNotifications({ messages } as never, env, { reminder: async () => undefined });
    }
  }
  return { env, queue, delivered, step, limited: () => limited };
}

const job = (chatId: number): NotificationJob => ({ bot: 'passenger', chatId, text: `x${chatId}` });

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('the bots under load (G86 T8, docs/122)', () => {
  it('loses none of 1000 mass messages and 50 answers, meets no 429, answers in 2 seconds (p95)', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(T0);
    const { env, queue, delivered, step, limited } = world();
    await notifyMass(
      env,
      Array.from({ length: MASS }, (_, index) => job(1000 + index)),
    );
    for (let chat = 1; chat <= ANSWERS; chat += 1) await notify(env, [job(chat)]);
    for (let at = T0; at <= T0 + END_MS && (queue.length > 0 || at === T0); at += STEP_MS) {
      vi.setSystemTime(at);
      await step();
    }
    expect([queue.length, delivered.size, limited()]).toEqual([0, MASS + ANSWERS, 0]);
    const answers = Array.from(
      { length: ANSWERS },
      (_, index) => (delivered.get(index + 1) ?? Infinity) - T0,
    );
    const p95 = answers.sort((one, other) => one - other)[Math.ceil(ANSWERS * P95) - 1];
    expect(p95).toBeLessThanOrEqual(2000);
  }, 60_000);
});
