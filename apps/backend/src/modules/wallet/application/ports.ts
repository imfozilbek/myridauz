import type { PromoRule } from '@platform/brands';
import type { Booking, Wallet } from '@platform/contracts';
import type { Operation } from '../domain/ledger';

// Ports of the wallet: D1 in production, memory in tests.
export type WalletRepository = {
  // The journal of a driver, the oldest first.
  operations(driverId: number): Promise<Operation[]>;
  // All rows or none. false: a commission or a refund of this booking is already there.
  append(operations: readonly Operation[]): Promise<boolean>;
  // The drivers among these who have a journal: one read through the index (G56).
  withJournal(driverIds: readonly number[]): Promise<number[]>;
  // "Hamyonlar" for the team: the balances of one page, the least main money first (G42).
  balances(offset: number, limit: number): Promise<{ driverId: number; bonus: number; main: number }[]>;
  // The Cron job: every bonus whose time is over burns in one step for all drivers (G42). Only the
  // drivers whose bonus time ended after `since` are read, through the index (G56).
  burnExpired(now: number, since: number, newId: () => string): Promise<void>;
  // The drivers with a bonus whose time ends in (from, to], through the index (G56, G68).
  bonusEndsBetween(from: number, to: number): Promise<number[]>;
};

// What the wallet says in the driver bot (G68, docs/122): money for fewer than 5 seats, the bonus ends.
export type WalletNews = 'fewSeats' | 'bonusEnds';

export type WalletBooking = { readonly passenger: string; readonly seats: number };

export type WalletDeps = {
  readonly wallet: WalletRepository;
  readonly promo: PromoRule;
  readonly people: {
    find(id: number): Promise<{ firstName: string; publicId: string } | undefined>;
    // The Telegram ID behind a public id from an admin path (docs/65 A3).
    idOf(publicId: string): Promise<number | undefined>;
  };
  // The passenger and the seats of each booking: «Komissiya · Sardor, 2 joy» (G63, G65).
  readonly bookings: (bookingIds: readonly string[]) => Promise<ReadonlyMap<string, WalletBooking>>;
  // The booking as its driver sees it, for the details of a commission (G65, mockup g65/2).
  readonly booking: (bookingId: string) => Promise<Booking | undefined>;
  // The seat price of the driver's last trip, null before the first (G65 «≈ N joyga yetadi»).
  readonly lastPrice: (driverId: number) => Promise<number | null>;
  // The commission of one seat at a price, by the rule of the brand (docs/12).
  readonly perSeat: (price: number) => number;
  // Fewer seats than this the money confirms: «Hamyon» turns red once (brand, G68, docs/122).
  readonly fewSeats: number;
  // The wallet card of the driver bot with its news under it (G68).
  readonly tell: (driverId: number, view: Wallet, news: WalletNews) => Promise<void>;
  readonly now: () => number;
  readonly newId: () => string;
};
