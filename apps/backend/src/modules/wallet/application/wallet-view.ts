import { NO_SHOW_REASON, type Wallet } from '@platform/contracts';
import { balanceOf, type Operation } from '../domain/ledger';
import { bonusExpiresAt } from '../domain/promo';
import type { WalletDeps } from './ports';

const HISTORY_LIMIT = 100;

// «Hamyon» (docs/12): the balances and the latest operations, the newest first. A refund of a
// no-show names the passenger who did not come: «Qaytarildi · Akmal kelmadi» (docs/129, G63).
export async function walletView(deps: WalletDeps, driverId: number): Promise<Wallet> {
  const operations = await deps.wallet.operations(driverId);
  const latest = operations.slice(-HISTORY_LIMIT).reverse();
  const noShowOf = (op: Operation) => (op.reason === NO_SHOW_REASON ? op.bookingId : null);
  const noShows = latest.flatMap((op) => noShowOf(op) ?? []);
  const names = noShows.length > 0 ? await deps.passengers(noShows) : new Map<string, string>();
  return {
    bonus: balanceOf(operations, 'bonus'),
    main: balanceOf(operations, 'main'),
    bonusExpiresAt: balanceOf(operations, 'bonus') > 0 ? bonusExpiresAt(operations) : null,
    operations: latest.map((op) => {
      const { id, kind, balance, amount, bookingId, reason, createdAt } = op;
      const row = { id, kind, balance, amount, bookingId, reason, createdAt };
      const passenger = names.get(noShowOf(op) ?? '');
      return passenger === undefined ? row : { ...row, passenger };
    }),
  };
}
