import type { ChatServerEvent } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { DRIVER, PASSENGER, room } from './chat-test-kit';

const SECOND = 1000;
const last = (events: ChatServerEvent[] | undefined, type: ChatServerEvent['type']) =>
  events?.filter((event) => event.type === type).at(-1);
const call = (action: string) => ({ type: 'call', action });

describe('voice calls in the chat (docs/08, G13)', () => {
  it('rings, is answered, connects and ends without a missed line', async () => {
    const chat = room();
    const passenger = chat.connect(PASSENGER);
    const driver = chat.connect(DRIVER);
    await chat.emit(passenger, call('ring'));
    expect(last(chat.inbox.get(1), 'call')).toEqual({
      type: 'call',
      call: { status: 'ringing', caller: 'other' },
    });
    expect(chat.wake.at).not.toBeNull();
    await chat.emit(driver, call('accept'));
    await chat.emit(passenger, call('connected'));
    expect(last(chat.inbox.get(10), 'call')).toEqual({
      type: 'call',
      call: { status: 'active', caller: 'me' },
    });
    expect(chat.wake.at).toBeNull();
    await chat.later(10 * 60 * SECOND);
    await chat.emit(driver, call('end'));
    expect(last(chat.inbox.get(10), 'callEnded')).toEqual({ type: 'callEnded', reason: 'ended' });
    expect(chat.deps.store.recent(10).some((m) => m.event === 'missed_call')).toBe(false);
    expect(chat.signals).toEqual([]);
  });

  it('opens the Mini App of a person away, calls them in through the bot after 5 seconds, then marks a missed call', async () => {
    const chat = room();
    const passenger = chat.connect(PASSENGER);
    await chat.emit(passenger, call('ring'));
    expect(chat.signals).toEqual(['open driver 1']);
    await chat.later(4 * SECOND);
    expect(chat.signals).toEqual(['open driver 1']);
    await chat.later(2 * SECOND);
    expect(chat.signals).toEqual(['open driver 1', 'ringing driver 1']);
    await chat.later(23 * SECOND);
    expect(chat.deps.store.call()).not.toBeNull();
    await chat.later(2 * SECOND);
    expect(chat.deps.store.call()).toBeNull();
    expect(last(chat.inbox.get(10), 'callEnded')).toEqual({ type: 'callEnded', reason: 'missed' });
    expect(chat.deps.store.recent(10).at(-1)?.event).toBe('missed_call');
    expect(chat.signals).toEqual(['open driver 1', 'ringing driver 1', 'missed driver 1']);
  });

  it('rings in the Mini App that opened the chat by itself: no bot message (docs/115)', async () => {
    const chat = room();
    const passenger = chat.connect(PASSENGER);
    await chat.emit(passenger, call('ring'));
    await chat.later(2 * SECOND);
    chat.connect(DRIVER);
    expect(last(chat.inbox.get(1), 'call')).toEqual({
      type: 'call',
      call: { status: 'ringing', caller: 'other' },
    });
    await chat.later(4 * SECOND);
    expect(chat.signals).toEqual(['open driver 1']);
    expect(chat.deps.store.call()?.status).toBe('ringing');
    await chat.later(25 * SECOND);
    expect(last(chat.inbox.get(1), 'callEnded')).toEqual({ type: 'callEnded', reason: 'missed' });
    expect(chat.signals).toEqual(['open driver 1']);
  });

  it('ends a call whose voice did not connect in 15 seconds', async () => {
    const chat = room();
    const passenger = chat.connect(PASSENGER);
    const driver = chat.connect(DRIVER);
    await chat.emit(passenger, call('ring'));
    await chat.emit(driver, call('accept'));
    await chat.later(16 * SECOND);
    expect(last(chat.inbox.get(10), 'callEnded')).toEqual({ type: 'callEnded', reason: 'failed' });
    expect(chat.deps.store.recent(10).at(-1)?.event).toBe('missed_call');
  });

  it('treats a closed Mini App during a talk as a broken call; a decline adds no line', async () => {
    const chat = room();
    const passenger = chat.connect(PASSENGER);
    const driver = chat.connect(DRIVER);
    await chat.emit(passenger, call('ring'));
    await chat.emit(driver, call('accept'));
    await chat.emit(driver, call('connected'));
    await chat.leave(driver);
    expect(last(chat.inbox.get(10), 'callEnded')).toEqual({ type: 'callEnded', reason: 'failed' });
    expect(chat.signals).toEqual(['missed driver 1']);
    const again = room();
    const caller = again.connect(PASSENGER);
    const callee = again.connect(DRIVER);
    await again.emit(caller, call('ring'));
    await again.emit(callee, call('decline'));
    expect(last(again.inbox.get(10), 'callEnded')).toEqual({ type: 'callEnded', reason: 'declined' });
    expect(again.deps.store.recent(10)).toEqual([]);
  });

  it('opens a call only after the booking is confirmed, one at a time, only to its two people', async () => {
    const chat = room();
    const early = chat.connect({ ...PASSENGER, canCall: false });
    expect(chat.inbox.get(10)?.[0]).toMatchObject({ type: 'history', canCall: false });
    await chat.emit(early, call('ring'));
    expect(chat.deps.store.call()).toBeNull();
    const second = room();
    const passenger = second.connect(PASSENGER);
    const driver = second.connect(DRIVER);
    await second.emit(passenger, call('ring'));
    await second.emit(driver, call('ring'));
    expect(second.deps.store.call()?.callerId).toBe(10);
    // The accept of the caller does nothing: only the callee answers.
    await second.emit(passenger, call('accept'));
    expect(second.deps.store.call()?.status).toBe('ringing');
  });

  it('passes the published voice of one side to the other side only', async () => {
    const chat = room();
    const passenger = chat.connect(PASSENGER);
    chat.connect(DRIVER);
    const track = { sessionId: 's1', trackName: 'voice-10' };
    await chat.emit(passenger, { type: 'callTrack', track });
    expect(last(chat.inbox.get(1), 'callTrack')).toBeUndefined();
    await chat.emit(passenger, call('ring'));
    await chat.emit(passenger, { type: 'callTrack', track });
    expect(last(chat.inbox.get(1), 'callTrack')).toEqual({ type: 'callTrack', track });
    expect(last(chat.inbox.get(10), 'callTrack')).toBeUndefined();
  });

  it('shows the current call to a person who opens the chat from the bot', async () => {
    const chat = room();
    const passenger = chat.connect(PASSENGER);
    await chat.emit(passenger, call('ring'));
    chat.connect(DRIVER);
    expect(chat.inbox.get(1)?.[1]).toEqual({ type: 'call', call: { status: 'ringing', caller: 'other' } });
  });
});
