import type { ChatSystemEvent } from '@platform/contracts';

// Who is in the chat of a booking (docs/07): its passenger and its driver, nobody else.
export type Role = 'passenger' | 'driver';
export type Member = { readonly userId: number; readonly role: Role; readonly otherId: number };
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
};

export type ChatSocket = { readonly member: Member; send(data: string): void };

// What the chat asks of the rest of Rida: the bot tells the other person, the team hears of contacts.
export type ChatSignals = {
  newMessage(to: { readonly userId: number; readonly role: Role }, key: string): Promise<void>;
  contactAttempts(userId: number, key: string, count: number): Promise<void>;
};

export type RoomDeps = {
  readonly key: string;
  readonly store: MessageStore;
  readonly sockets: () => readonly ChatSocket[];
  readonly signals: ChatSignals;
  readonly now: () => number;
};
