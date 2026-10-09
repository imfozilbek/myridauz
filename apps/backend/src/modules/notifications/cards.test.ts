import { afterEach, describe, expect, it, vi } from 'vitest';
import { testD1 } from '../../test-d1';
import { forgetCards, showCards, type Card } from '.';

type Call = { method: string; body: Record<string, unknown> };

// Telegram for one test: every call recorded, message ids from 70; an edit can be refused.
function telegram(refuseEdit?: string) {
  const calls: Call[] = [];
  let next = 70;
  vi.stubGlobal('fetch', async (input: string, init?: RequestInit) => {
    const method = input.split('/').pop() ?? '';
    calls.push({ method, body: JSON.parse(String(init?.body)) as Record<string, unknown> });
    if (method === 'editMessageText' && refuseEdit)
      return Response.json({ ok: false, description: refuseEdit }, { status: 400 });
    return Response.json({ ok: true, result: { message_id: next++ } });
  });
  return calls;
}

const env = () => ({ PASSENGER_BOT_TOKEN: 'p', DB: testD1() }) as never;
const CARD: Card = { bot: 'passenger', chatId: 5, key: 'trip:b1', text: '<b>Javob kutilmoqda</b>' };

afterEach(() => vi.unstubAllGlobals());

describe('live cards of the bots (G68, docs/122 rule 1)', () => {
  it('sends a card once without sound, edits it when it changes, leaves it when it does not', async () => {
    const calls = telegram();
    const bindings = env();
    await showCards(bindings, [CARD]);
    await showCards(bindings, [CARD]);
    await showCards(bindings, [{ ...CARD, text: '<b>Joy tasdiqlandi</b>' }]);
    expect(calls.map((call) => call.method)).toEqual(['sendMessage', 'editMessageText']);
    expect(calls[0]?.body).toMatchObject({ chat_id: 5, parse_mode: 'HTML', disable_notification: true });
    expect(calls[1]?.body).toMatchObject({ message_id: 70, text: '<b>Joy tasdiqlandi</b>' });
  });

  it('pins the trip on top of the chat without sound and takes it off when the trip is over', async () => {
    const calls = telegram();
    const bindings = env();
    await showCards(bindings, [{ ...CARD, pin: true }]);
    await showCards(bindings, [{ ...CARD, pin: true }]);
    await showCards(bindings, [{ ...CARD, text: '<b>Yetib keldingiz</b>', pin: false }]);
    expect(calls.map((call) => call.method)).toEqual([
      'sendMessage',
      'pinChatMessage',
      'editMessageText',
      'unpinChatMessage',
    ]);
    expect(calls[1]?.body).toEqual({ chat_id: 5, message_id: 70, disable_notification: true });
  });

  it('a ring answers its card with sound; at night or on the road it comes quietly', async () => {
    const calls = telegram();
    const bindings = env();
    const ring = { bot: 'passenger' as const, chatId: 5, text: '✅ Jasur tasdiqladi', card: CARD.key };
    await showCards(bindings, [CARD], [{ ...ring, quiet: false }]);
    await showCards(bindings, [], [{ ...ring, quiet: true }]);
    expect(calls[1]?.body).toMatchObject({ reply_parameters: { message_id: 70 } });
    expect(calls[1]?.body).not.toHaveProperty('disable_notification');
    expect(calls[2]?.body).toMatchObject({ reply_parameters: { message_id: 70 }, disable_notification: true });
  });

  it('a card the person deleted comes anew, and the next change edits the new one', async () => {
    const bindings = env();
    telegram();
    await showCards(bindings, [CARD]);
    const refused = telegram('Bad Request: message to edit not found');
    await showCards(bindings, [{ ...CARD, text: '<b>Joy tasdiqlandi</b>' }]);
    expect(refused.map((call) => call.method)).toEqual(['editMessageText', 'sendMessage']);
    const calls = telegram();
    await showCards(bindings, [{ ...CARD, text: '<b>Yoʻldasiz</b>' }]);
    expect(calls[0]?.body).toMatchObject({ message_id: 70 });
  });

  it('a deleted account takes its cards with it (docs/30)', async () => {
    const calls = telegram();
    const bindings = env();
    await showCards(bindings, [CARD]);
    await forgetCards(bindings, 5);
    await showCards(bindings, [CARD]);
    expect(calls.map((call) => call.method)).toEqual(['sendMessage', 'sendMessage']);
  });
});
