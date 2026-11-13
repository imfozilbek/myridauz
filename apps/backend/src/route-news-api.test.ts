import { toCyrillic } from '@platform/i18n';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { approvedDriver, json, read } from './bookings-test-api';
import type { QueueMessage, TimedTask } from './modules/notifications';
import { call, registerUser, testEnv } from './test-api';
import { runRouteNews } from './trip-events';

const telegram: { chatId: unknown; text: string }[] = [];
vi.stubGlobal('fetch', async (_input: string, init?: RequestInit) => {
  const body = typeof init?.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : {};
  telegram.push({ chatId: body.chat_id, text: String(body.text ?? '') });
  return Response.json({ ok: true, result: { message_id: telegram.length } });
});
afterAll(() => vi.unstubAllGlobals());
const DRIVER = 81;
const PASSENGER = 82;
const NEWS = toCyrillic('Bugungi yangi safarlar');

// G86 T8 (docs/122): 1 000 subscribers kept the publishing waiting over 15 seconds on the stand. The
// news of a route goes to the queue as a task: the driver gets the answer at once.
describe('the news of a new trip to the subscribers of its route', () => {
  it('goes after the answer through the queue, then reaches the subscriber', async () => {
    await approvedDriver(DRIVER);
    await registerUser(PASSENGER);
    const route = { from: '1726', to: '1718', date: null, woman: false };
    await call('/passenger/subscriptions', PASSENGER, json(route));
    const queued: { body: QueueMessage }[] = [];
    const NOTIFICATIONS = {
      sendBatch: async (items: { body: QueueMessage }[]) => void queued.push(...items),
    };
    const trip = {
      ...{ from: '1726273', to: '1718401', departAt: Date.now() + 5 * 3_600_000, seats: 2, price: 90_000 },
      ...{ womanOnBoard: false, pickupMode: 'door', comment: '' },
    };
    telegram.length = 0;
    const published = await read<{ id: string }>(
      call('/driver/trips', DRIVER, { app: 'driver', env: { NOTIFICATIONS }, ...json(trip) }),
    );
    const task = queued.map((item) => item.body).find((body): body is TimedTask => 'task' in body);
    expect(task).toEqual({ task: 'route_news', data: { tripId: published.id, news: 'published', from: 0 } });
    expect(telegram.filter((sent) => sent.chatId === PASSENGER)).toEqual([]);
    if (task) await runRouteNews(testEnv as never, task);
    expect(telegram.find((sent) => sent.chatId === PASSENGER)?.text).toContain(NEWS);
  });
});
