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
};

export type WalletDeps = {
  readonly wallet: WalletRepository;
  readonly promo: PromoRule;
  readonly people: { find(id: number): Promise<{ firstName: string } | undefined> };
  readonly now: () => number;
  readonly newId: () => string;
};
