import { app } from './app';
import { describe, expect, it } from 'vitest';
import { OWNER } from './bookings-test-api';
import { botSender } from './bots/test-bot';
import { localAnalyticsRows } from './modules/analytics';
import { call, testEnv } from './test-api';

const SESSION = '6f1c2f7e-3c1b-4f5e-9a3d-2b8c1d0e4f5a';
const event = (name: string, extra: object = {}) => ({
  name,
  app: 'passenger',
  screen: 'home',
  at: Date.now(),
  sessionId: SESSION,
  version: '1',
  ...extra,
});
const bot = botSender(async () => Response.json({ ok: true, result: {} }));

describe('GET /admin/stats (G12, docs/29)', () => {
  it('shows the team the funnels built from the events of the Mini Apps and the bots', async () => {
    const batch = { events: [event('screen_open'), event('trip_search', { result: 'empty' })] };
    await app.request('/analytics', { method: 'POST', body: JSON.stringify(batch) }, testEnv);
    await bot('passenger', { message: { message_id: 1, text: '/start', chat: { id: 5 }, from: { id: 5 } } });
    expect(localAnalyticsRows.at(-1)?.blobs).toEqual(['bot_command', 'passenger', '', '', '', 'start']);
    const response = await call('/admin/stats?period=week', OWNER, { app: 'admin' });
    expect(response.status).toBe(200);
    const stats = (await response.json()) as { events: string; funnels: { id: string; steps: unknown[] }[] };
    expect(stats.events).toBe('on');
    expect(stats.funnels.find((funnel) => funnel.id === 'passenger')?.steps.slice(0, 2)).toEqual([
      { step: 'opened', count: 1, drop: null },
      { step: 'searched', count: 1, drop: 0 },
    ]);
  });

  it('is only for the team and knows only two periods', async () => {
    expect((await call('/admin/stats', 77, { app: 'admin' })).status).toBe(403);
    expect((await call('/admin/stats?period=year', OWNER, { app: 'admin' })).status).toBe(400);
  });
});
