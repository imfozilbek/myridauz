import type { ChatServerEvent } from '@platform/contracts';
import { callLeft, callTimeout } from './application/call-room';
import { received } from './application/dispatch';
import type { ChatSocket, Member, RoomDeps } from './application/ports';
import { joined } from './application/room';
import { createMemoryMessages } from './infrastructure/memory-messages';

// A chat of one confirmed booking in memory: sockets, inboxes, bot signals, the clock, wake-ups.
const OPEN = { canCall: true, canWrite: true, callsOff: false, ringLimit: null } as const;
export const PASSENGER: Member = { userId: 10, role: 'passenger', otherId: 1, ...OPEN };
export const DRIVER: Member = { userId: 1, role: 'driver', otherId: 10, ...OPEN };
export const MINUTE = 60 * 1000;
const SECOND = 1000;

export function room() {
  let now = Date.parse('2026-10-01T05:00:00Z');
  let open: ChatSocket[] = [];
  const inbox = new Map<number, ChatServerEvent[]>();
  const signals: string[] = [];
  const wake: { at: number | null } = { at: null };
  // The unread messages of each person in this chat (G53).
  const unread = new Map<number, number>();
  const deps: RoomDeps = {
    key: 'b00000000-0000-0000-0000-000000000001',
    store: createMemoryMessages(),
    sockets: () => open,
    signals: {
      newMessage: async (to) => void signals.push(`new to ${to.role} ${to.userId}`),
      contactAttempts: async (userId, _key, count) => void signals.push(`attempts ${userId} ${count}`),
      openCall: async (to) => void signals.push(`open ${to.role} ${to.userId}`),
      incomingCall: async (to) => void signals.push(`ringing ${to.role} ${to.userId}`),
      missedCall: async (to) => void signals.push(`missed ${to.role} ${to.userId}`),
    },
    unread: {
      add: async (to) => void unread.set(to.userId, (unread.get(to.userId) ?? 0) + 1),
      clear: async (userId) => void unread.delete(userId),
    },
    now: () => now,
    calls: { ringMs: 30 * SECOND, connectMs: 15 * SECOND, inviteMs: 5 * SECOND },
    wakeAt: (at) => void (wake.at = at),
  };
  const connect = (member: Member) => {
    const socket: ChatSocket = {
      member,
      send: (data) => inbox.set(member.userId, [...(inbox.get(member.userId) ?? []), JSON.parse(data)]),
    };
    open.push(socket);
    void joined(deps, socket);
    return socket;
  };
  const emit = (socket: ChatSocket, event: object) => received(deps, socket, JSON.stringify(event));
  const say = (socket: ChatSocket, text: string) => emit(socket, { type: 'send', text });
  const leave = (socket: ChatSocket) => {
    open = open.filter((item) => item !== socket);
    return callLeft(deps, socket.member);
  };
  // The chat wakes up when its alarm is due.
  const later = async (ms: number) => {
    now += ms;
    if (wake.at !== null && wake.at <= now) await callTimeout(deps);
  };
  return { deps, connect, emit, say, leave, inbox, signals, later, open, wake, unread };
}
