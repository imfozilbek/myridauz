import { DAY_MS } from '@platform/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { testD1 } from '../../test-d1';
import { forgetCards, showNews, type News } from '.';

type Call = { method: string; body: Record<string, unknown> };

function telegram() {
  const calls: Call[] = [];
  let next = 70;
  vi.stubGlobal('fetch', async (input: string, init?: RequestInit) => {
    calls.push({
      method: input.split('/').pop() ?? '',
      body: JSON.parse(String(init?.body)) as Record<string, unknown>,
    });
    return Response.json({ ok: true, result: { message_id: next++ } });
  });
  return calls;
}

// 2026-10-01 10:00 and 23:00 in Tashkent.
const DAY = Date.parse('2026-10-01T05:00:00Z');
const NIGHT = Date.parse('2026-10-01T18:00:00Z');
const NEWS: News = {
  bot: 'passenger',
  chatId: 5,
  route: '1726>1718',
  head: ['🔔 Bugungi yangi safarlar'],
  foot: 'Kuniga bitta xabar',
  markup: { inline_keyboard: [] },
};
const line = (id: string, text: string, order: number) => ({ ...NEWS, line: { id, text, order } });
const env = () => ({ PASSENGER_BOT_TOKEN: 'p', DB: testD1() }) as never;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

// The new trips or requests of a route: one card a day, edited by the next news (docs/122 rule 4).
describe('the news card of a route (G68, docs/122 rule 4)', () => {
  it('rings once a day, the next news edit the card in the order of the trips', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: DAY });
    const calls = telegram();
    const bindings = env();
    await showNews(bindings, line('t2', 'Nodira · 13:00', 13));
    await showNews(bindings, line('t1', 'Jasur · 07:30', 7));
    await showNews(bindings, line('t2', 'Nodira · 13:00 ↓', 13));
    expect(calls.map((call) => call.method)).toEqual(['sendMessage', 'editMessageText', 'editMessageText']);
    expect(calls[0]?.body).not.toHaveProperty('disable_notification');
    expect(calls[1]?.body).toMatchObject({ message_id: 70 });
    expect(calls[2]?.body.text).toBe(
      '🔔 Bugungi yangi safarlar\nJasur · 07:30\nNodira · 13:00 ↓\nKuniga bitta xabar',
    );
    vi.setSystemTime(DAY + DAY_MS);
    await showNews(bindings, line('t3', 'Bobur · 16:30', 16));
    expect(calls.at(-1)).toMatchObject({ method: 'sendMessage' });
    expect(calls.at(-1)?.body.text).toBe('🔔 Bugungi yangi safarlar\nBobur · 16:30\nKuniga bitta xabar');
  });

  it('comes without sound at night and goes with a deleted account', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: NIGHT });
    const calls = telegram();
    const bindings = env();
    await showNews(bindings, line('t1', 'Jasur · 07:30', 7));
    expect(calls[0]?.body).toMatchObject({ disable_notification: true });
    await forgetCards(bindings, 5);
    await showNews(bindings, line('t2', 'Nodira · 13:00', 13));
    expect(calls.at(-1)).toMatchObject({ method: 'sendMessage' });
    expect(calls.at(-1)?.body.text).not.toContain('Jasur');
  });
});
