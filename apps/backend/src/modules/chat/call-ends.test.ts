import type { ChatServerEvent } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { DRIVER, PASSENGER, room } from './chat-test-kit';

const SECOND = 1000;
const call = (action: string) => ({ type: 'call', action });
const ended = (events: ChatServerEvent[] | undefined) =>
  events?.filter((event) => event.type === 'callEnded').at(-1);

// G89: every way a call ends (docs/08): the right reason for both sides, a missed call only for a
// ring nobody took, and a step of nobody's call changes nothing.
describe('the end of a call', () => {
  it('ignores a step when there is no call', async () => {
    const chat = room();
    const driver = chat.connect(DRIVER);
    await chat.emit(driver, call('accept'));
    await chat.emit(driver, call('end'));
    expect(chat.deps.store.call()).toBeNull();
    expect(ended(chat.inbox.get(1))).toBeUndefined();
  });

  it('fails a call the phone could not connect, and a hang up before the voice came', async () => {
    for (const action of ['failed', 'end']) {
      const chat = room();
      const passenger = chat.connect(PASSENGER);
      const driver = chat.connect(DRIVER);
      await chat.emit(passenger, call('ring'));
      await chat.emit(driver, call('accept'));
      await chat.emit(passenger, call(action));
      expect(ended(chat.inbox.get(1))).toEqual({ type: 'callEnded', reason: 'failed' });
    }
  });

  it('keeps a talk going when the time of a ring passes', async () => {
    const chat = room();
    const passenger = chat.connect(PASSENGER);
    const driver = chat.connect(DRIVER);
    await chat.emit(passenger, call('ring'));
    await chat.emit(driver, call('accept'));
    await chat.emit(passenger, call('connected'));
    await chat.later(60 * SECOND);
    expect(chat.deps.store.call()?.status).toBe('active');
  });

  it('breaks a talk when a side leaves, and misses a ring when the caller leaves', async () => {
    const talk = room();
    const passenger = talk.connect(PASSENGER);
    const driver = talk.connect(DRIVER);
    await talk.emit(passenger, call('ring'));
    await talk.emit(driver, call('accept'));
    await talk.emit(passenger, call('connected'));
    await talk.leave(driver);
    expect(ended(talk.inbox.get(10))).toEqual({ type: 'callEnded', reason: 'failed' });
    const ringing = room();
    const caller = ringing.connect(PASSENGER);
    const callee = ringing.connect(DRIVER);
    await ringing.emit(caller, call('ring'));
    // The callee closing the chat does not end the ring: the bot may still call them in.
    await ringing.leave(callee);
    expect(ringing.deps.store.call()?.status).toBe('ringing');
    await ringing.leave(caller);
    expect(ringing.deps.store.call()).toBeNull();
  });
});
