import type { ChatSystemEvent } from '@platform/contracts';

// Who is in the chat of a booking (docs/07): its passenger and its driver, nobody else.
export type Role = 'passenger' | 'driver';
// canCall: the booking is confirmed, a voice call is open (docs/08).
export type Member = {
  readonly userId: number;
  readonly role: Role;
  readonly otherId: number;
  readonly canCall: boolean;
};
export const otherRole = (role: Role): Role => (role === 'passenger' ? 'driver' : 'passenger');

// Author 0 is the system: lines about the booking itself.
export const SYSTEM_AUTHOR = 0;
export type StoredMessage = {
  readonly id: number;
  readonly author: number;
  readonly text: string;
  readonly event: ChatSystemEvent | null;
  readonly masked: boolean;
  readonly at: number;
};

// The storage of one chat: SQLite of its Durable Object in production, memory in tests.
export type MessageStore = {
  add(message: Omit<StoredMessage, 'id'>): StoredMessage;
  recent(limit: number): StoredMessage[];
  maskedCount(userId: number): number;
  lastNotified(userId: number): number | null;
  notified(userId: number, at: number): void;
  // The call of this chat right now, if any (docs/08): kept so it survives the chat's sleep.
  call(): StoredCall | null;
  saveCall(call: StoredCall | null): void;
};

type CallStatus = 'ringing' | 'connecting' | 'active';
export type StoredCall = {
  readonly callerId: number;
  readonly calleeId: number;
  // The bot of the callee tells about a call while the Mini App is closed.
  readonly calleeRole: Role;
  readonly status: CallStatus;
};
type CallRules = { readonly ringMs: number; readonly connectMs: number };

export type ChatSocket = { readonly member: Member; send(data: string): void };

// What the chat asks of the rest of Rida: the bot tells the other person, the team hears of contacts.
export type ChatSignals = {
  newMessage(to: { readonly userId: number; readonly role: Role }, key: string): Promise<void>;
  contactAttempts(userId: number, key: string, count: number): Promise<void>;
  // "Sizga qoʻngʻiroq qilishyapti" while the Mini App is closed; "Sizga qoʻngʻiroq qilishdi" after.
  incomingCall(to: { readonly userId: number; readonly role: Role }, key: string): Promise<void>;
  missedCall(to: { readonly userId: number; readonly role: Role }, key: string): Promise<void>;
};

export type RoomDeps = {
  readonly key: string;
  readonly store: MessageStore;
  readonly sockets: () => readonly ChatSocket[];
  readonly signals: ChatSignals;
  readonly now: () => number;
  readonly calls: CallRules;
  // The chat wakes up at this time to end a call nobody answered or connected (null: no wake-up).
  readonly wakeAt: (at: number | null) => void;
};
