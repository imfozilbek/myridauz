import { describe, expect, it } from 'vitest';
import { systemEvent } from './application/room';
import { signTicket, verifyTicket } from './application/ticket';
import { DRIVER, MINUTE, PASSENGER, room } from './chat-test-kit';
import { MASK } from './domain/mask';

describe('the chat of a booking (docs/07)', () => {
  it('delivers a message to both sides at once, as "me" and "other"', async () => {
    const { connect, say, inbox } = room();
    const passenger = connect(PASSENGER);
    connect(DRIVER);
    await say(passenger, 'Salom! Qayerda uchrashamiz?');
    const last = (id: number) => inbox.get(id)?.at(-1);
    expect(last(10)).toMatchObject({
      type: 'message',
      message: { author: 'me', text: 'Salom! Qayerda uchrashamiz?' },
    });
    expect(last(1)).toMatchObject({ type: 'message', message: { author: 'other' } });
  });

  it('hides a phone, warns the sender and tells the moderators every third time', async () => {
    const { connect, say, inbox, signals } = room();
    const passenger = connect(PASSENGER);
    connect(DRIVER);
    await say(passenger, 'Raqamim 90 123 45 67');
    expect(inbox.get(1)?.at(-1)).toMatchObject({ message: { text: `Raqamim ${MASK}` } });
    expect(inbox.get(10)?.at(-1)).toEqual({ type: 'warning' });
    await say(passenger, '@ali_driver');
    expect(signals).toEqual([]);
    await say(passenger, 't.me/ali');
    expect(signals).toEqual(['attempts 10 3']);
  });

  it('asks the bot to tell the other side only when they are away, and not on every message', async () => {
    const { connect, say, signals, later } = room();
    const passenger = connect(PASSENGER);
    await say(passenger, 'Salom');
    await say(passenger, 'Javob bering');
    expect(signals).toEqual(['new to driver 1']);
    await later(6 * MINUTE);
    await say(passenger, 'Kutyapman');
    expect(signals).toEqual(['new to driver 1', 'new to driver 1']);
    const driver = connect(DRIVER);
    await say(driver, 'Hozir');
    expect(signals).toEqual(['new to driver 1', 'new to driver 1']);
  });

  it('counts the messages a person has not seen yet and forgets them when the chat opens (G53)', async () => {
    const { connect, say, unread } = room();
    const passenger = connect(PASSENGER);
    await say(passenger, 'Salom');
    await say(passenger, 'Javob bering');
    expect(unread.get(DRIVER.userId)).toBe(2);
    // The sender never has unread messages of their own; one who is in the chat sees them at once.
    expect(unread.get(PASSENGER.userId)).toBeUndefined();
    const driver = connect(DRIVER);
    await Promise.resolve();
    expect(unread.get(DRIVER.userId)).toBeUndefined();
    await say(driver, 'Hozir');
    expect(unread.get(PASSENGER.userId)).toBeUndefined();
  });

  it('keeps the history, system lines included, and ignores anything but text', async () => {
    const { deps, connect, say, emit, inbox } = room();
    const passenger = connect(PASSENGER);
    await say(passenger, 'Salom');
    systemEvent(deps, 'confirmed');
    await emit(passenger, { type: 'voice', data: 'x' });
    connect(DRIVER);
    const history = inbox.get(1)?.[0];
    expect(history).toMatchObject({
      type: 'history',
      messages: [
        { author: 'other', text: 'Salom' },
        { author: 'system', event: 'confirmed' },
      ],
    });
  });
});

describe('the ticket of the chat socket', () => {
  const key = 'b00000000-0000-0000-0000-000000000001';
  const now = Date.parse('2026-10-01T05:00:00Z');

  it('opens only its own chat, only for a minute, only unchanged', async () => {
    const ticket = await signTicket('secret', key, PASSENGER.userId, now);
    expect(await verifyTicket('secret', key, ticket, now)).toBe(PASSENGER.userId);
    // The browser reads the ticket: it never names the other person (docs/65 A3).
    const [body] = ticket.split('.');
    const payload = atob((body ?? '').replaceAll('-', '+').replaceAll('_', '/'));
    expect(JSON.parse(payload)).toMatchObject({ data: { key, userId: PASSENGER.userId } });
    expect(payload).not.toContain('otherId');
    expect(await verifyTicket('secret', 'o00000000-0000-0000-0000-000000000001', ticket, now)).toBeNull();
    expect(await verifyTicket('secret', key, ticket, now + 2 * MINUTE)).toBeNull();
    expect(await verifyTicket('other', key, ticket, now)).toBeNull();
    expect(await verifyTicket('secret', key, `x${ticket}`, now)).toBeNull();
    expect(await verifyTicket('secret', key, 'broken', now)).toBeNull();
  });
});
