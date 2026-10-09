import type { ChatServerEvent } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { DRIVER, PASSENGER, room } from './chat-test-kit';

const SECOND = 1000;
const last = (events: ChatServerEvent[] | undefined, type: ChatServerEvent['type']) =>
  events?.filter((event) => event.type === type).at(-1);
const call = (action: string) => ({ type: 'call', action });

// A talk about a request (G64, docs/118 path 7): the driver calls before a booking, at most as many
// times as the brand allows, never when the passenger turned the calls off.
describe('calls about a request before a booking (G64)', () => {
  it('refuses the ring of a driver whose passenger turned the calls off, and the passenger hears nothing', async () => {
    const chat = room();
    chat.connect(PASSENGER);
    const driver = chat.connect({ ...DRIVER, callsOff: true, ringLimit: 3 });
    await chat.emit(driver, call('ring'));
    expect(last(chat.inbox.get(1), 'callRefused')).toEqual({ type: 'callRefused', reason: 'off' });
    expect(chat.deps.store.call()).toBeNull();
    expect(last(chat.inbox.get(10), 'call')).toBeUndefined();
  });

  it('lets a driver ring three times, then refuses with the limit', async () => {
    const chat = room();
    chat.connect(PASSENGER);
    const driver = chat.connect({ ...DRIVER, ringLimit: 3 });
    for (let ring = 0; ring < 3; ring += 1) {
      await chat.emit(driver, call('ring'));
      expect(chat.deps.store.call()).not.toBeNull();
      await chat.emit(driver, call('end'));
      await chat.later(SECOND);
    }
    await chat.emit(driver, call('ring'));
    expect(last(chat.inbox.get(1), 'callRefused')).toEqual({ type: 'callRefused', reason: 'limit' });
    expect(chat.deps.store.call()).toBeNull();
  });

  it('counts nothing for a call after the booking, and the passenger always rings the driver', async () => {
    const chat = room();
    const passenger = chat.connect({ ...PASSENGER, ringLimit: null });
    const driver = chat.connect(DRIVER);
    for (let ring = 0; ring < 5; ring += 1) {
      await chat.emit(driver, call('ring'));
      await chat.emit(driver, call('end'));
    }
    await chat.emit(passenger, call('ring'));
    expect(last(chat.inbox.get(1), 'call')).toEqual({
      type: 'call',
      call: { status: 'ringing', caller: 'other' },
    });
    expect(chat.inbox.get(1)?.some((event) => event.type === 'callRefused')).toBe(false);
  });
});
