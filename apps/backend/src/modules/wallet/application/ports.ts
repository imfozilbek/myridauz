import type { PromoRule } from '@platform/brands';
import type { Operation } from '../domain/ledger';

// Ports of the wallet: D1 in production, memory in tests.
export type WalletRepository = {
  // The journal of a driver, the oldest first.
  operations(driverId: number): Promise<Operation[]>;
  // All rows or none. false: a commission or a refund of this booking is already there.
  append(operations: readonly Operation[]): Promise<boolean>;
  // Drivers with anything in the journal, for the team and the Cron job.
  drivers(): Promise<number[]>;
  // "Hamyonlar" for the team: the balances of one page, the least main money first (G42).
  balances(offset: number, limit: number): Promise<{ driverId: number; bonus: number; main: number }[]>;
  // The Cron job: every bonus whose time is over burns in one step for all drivers (G42).
  burnExpired(now: number, newId: () => string): Promise<void>;
};

export type WalletDeps = {
  readonly wallet: WalletRepository;
  readonly promo: PromoRule;
  readonly people: {
    find(id: number): Promise<{ firstName: string; publicId: string } | undefined>;
    // The Telegram ID behind a public id from an admin path (docs/65 A3).
    idOf(publicId: string): Promise<number | undefined>;
  };
  readonly now: () => number;
  readonly newId: () => string;
};
