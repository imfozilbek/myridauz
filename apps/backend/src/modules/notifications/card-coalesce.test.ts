import { afterEach, describe, expect, it, vi } from 'vitest';
import { testD1 } from '../../test-d1';
import { showCards, type Card } from '.';
import { cardJob } from './application/cards';
import { cardWait } from './application/pace';
import { d1Cards } from './infrastructure/d1-cards';
import { deliverNow } from './infrastructure/deliver-now';

// Telegram for one test: every method recorded, message ids from 70.
function telegram() {
  const calls: { method: string; text: unknown }[] = [];
  let next = 70;
  vi.stubGlobal('fetch', async (input: string, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as { text?: string };
    calls.push({ method: input.split('/').pop() ?? '', text: body.text });
    return Response.json({ ok: true, result: { message_id: next++ } });
  });
  return calls;
}

// A card job that must be there: an edit of a card sent before.
async function edit(...args: Parameters<typeof cardJob>) {
  const job = await cardJob(...args);
  if (!job) throw new Error('no edit');
  return job;
}

const CARD: Card = { bot: 'passenger', chatId: 5, key: 'trip:b1', text: '<b>Kutilmoqda</b>' };
const db = () => testD1();

afterEach(() => vi.unstubAllGlobals());

describe('one card, two requests at once (G86 T5, docs/122)', () => {
  it('sends one edit: the older state waiting for Telegram is not sent, in any order', async () => {
    const calls = telegram();
    const env = { PASSENGER_BOT_TOKEN: 'p', DB: db() } as never as Parameters<typeof deliverNow>[0];
    await showCards(env, [CARD]);
    const store = d1Cards(env.DB as D1Database);
    // Both requests read the card before either one reached Telegram.
    const booked = await edit(store, { ...CARD, text: '<b>Joy tasdiqlandi</b>' }, 0);
    const moved = await edit(store, { ...CARD, text: '<b>Vaqt oʻzgardi</b>' }, 0);
    expect(await deliverNow(env, booked)).toEqual({ outcome: 'drop' });
    expect((await deliverNow(env, moved)).outcome).toBe('sent');
    expect(calls).toEqual([
      { method: 'sendMessage', text: '<b>Kutilmoqda</b>' },
      { method: 'editMessageText', text: '<b>Vaqt oʻzgardi</b>' },
    ]);
    // Once shown, the card takes the next edit as before.
    await showCards(env, [CARD]);
    expect(calls.at(-1)).toEqual({ method: 'editMessageText', text: '<b>Kutilmoqda</b>' });
  });

  it('edits a card at most once a second: an edit right after the last one waits for its second', async () => {
    telegram();
    const env = { PASSENGER_BOT_TOKEN: 'p', DB: db() } as never as Parameters<typeof deliverNow>[0];
    const before = Date.now();
    await showCards(env, [CARD]);
    const store = d1Cards(env.DB as D1Database);
    const sentAt = (await store.find('passenger', 5, CARD.key))?.updatedAt ?? 0;
    expect(sentAt).toBeGreaterThanOrEqual(before);
    const soon = await edit(store, { ...CARD, text: '<b>Joy tasdiqlandi</b>' }, sentAt + 200);
    expect(cardWait(soon, sentAt + 200)).toBe(1);
    const later = await edit(store, { ...CARD, text: '<b>Joy tasdiqlandi</b>' }, sentAt + 1500);
    expect(cardWait(later, sentAt + 1500)).toBe(0);
  });
});
