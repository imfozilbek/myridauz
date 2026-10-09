import type { Booking, Trip } from '@platform/contracts';
import type { NotificationJob } from '../../notifications';
import type { ShareRecord, ShareSubject } from '../domain/share';

// Ports of the shares module: D1 in production, memory in tests.
export type ShareRepository = {
  save(share: ShareRecord): Promise<void>;
  find(tokenHash: string): Promise<ShareRecord | undefined>;
  // "Ulashishni toʻxtatish": every link of the subject stops working, close people hear no more.
  revoke(subject: ShareSubject, at: number): Promise<void>;
  followers(subject: ShareSubject): Promise<number[]>;
  follow(subject: ShareSubject, telegramId: number, at: number): Promise<void>;
  // A deleted account (docs/30): it follows no trip any more.
  unfollowAll(telegramId: number): Promise<void>;
};

export type ShareUpdate = 'boarded' | 'arrived' | 'cancelled';

// The driver's own trip as the family sees it (G18): the name, the car and the plate, never a phone.
export type DriverTrip = {
  readonly id: string;
  readonly driverId: number;
  readonly driverName: string;
  readonly car: Trip['driver']['car'];
  readonly plate: string;
  readonly from: string;
  readonly to: string;
  readonly departAt: number;
  // «Yoʻlga chiqdim» and «Yetib keldik» of the driver (G63): the family reads them at once.
  readonly departedAt: number | null;
  readonly arrivedAt: number | null;
  readonly km: number;
  readonly status: Trip['status'];
};

// The texts of the card and of the bot messages to close people (docs/43), in the language files.
export type ShareTexts = {
  card(booking: Booking): Promise<string>;
  driverCard(trip: DriverTrip): Promise<string>;
  update(booking: Booking, update: ShareUpdate): string;
  cancelled(): string;
};

// The view has the public id only; the owner check needs the Telegram ID (docs/65 A3).
export type SharedBooking = { readonly view: Booking; readonly passengerId: number };

export type SharesDeps = {
  readonly shares: ShareRepository;
  // The booking as its passenger sees it: the plate opens after the confirmation (docs/07).
  readonly booking: (id: string) => Promise<SharedBooking | undefined>;
  readonly driverTrip: (id: string) => Promise<DriverTrip | undefined>;
  readonly texts: ShareTexts;
  // Telegram keeps the card for the "send to a chat" window of the Mini App's own bot;
  // null: the plain link is used.
  readonly prepare: (
    bot: 'passenger' | 'driver',
    userId: number,
    text: string,
    link: string,
  ) => Promise<string | null>;
  readonly link: (token: string) => string;
  readonly notify: (jobs: readonly NotificationJob[]) => Promise<void>;
  // The close ones who follow one trip at most (brand, docs/43, docs/128 §4).
  readonly followers: number;
  readonly now: () => number;
};

export type Result<T, E extends string> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
