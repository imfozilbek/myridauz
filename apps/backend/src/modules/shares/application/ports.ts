import type { Booking } from '@platform/contracts';
import type { NotificationJob } from '../../notifications';
import type { ShareRecord } from '../domain/share';

// Ports of the shares module: D1 in production, memory in tests.
export type ShareRepository = {
  save(share: ShareRecord): Promise<void>;
  find(tokenHash: string): Promise<ShareRecord | undefined>;
  // "Ulashishni toʻxtatish": every link of the booking stops working, close people hear no more.
  revoke(bookingId: string, at: number): Promise<void>;
  followers(bookingId: string): Promise<number[]>;
  follow(bookingId: string, telegramId: number, at: number): Promise<void>;
};

export type ShareUpdate = 'boarded' | 'arrived' | 'cancelled';

// The texts of the card and of the bot messages to close people (docs/43), in the language files.
export type ShareTexts = {
  card(booking: Booking): Promise<string>;
  update(booking: Booking, update: ShareUpdate): string;
};

export type SharesDeps = {
  readonly shares: ShareRepository;
  // The booking as its passenger sees it: the plate opens after the confirmation (docs/07).
  readonly booking: (id: string) => Promise<Booking | undefined>;
  readonly texts: ShareTexts;
  // Telegram keeps the card for the "send to a chat" window; null: the plain link is used.
  readonly prepare: (passengerId: number, text: string, link: string) => Promise<string | null>;
  readonly link: (token: string) => string;
  readonly notify: (jobs: readonly NotificationJob[]) => Promise<void>;
  readonly now: () => number;
};

export type Result<T, E extends string> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
