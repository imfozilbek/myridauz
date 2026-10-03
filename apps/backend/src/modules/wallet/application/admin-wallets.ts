import type { AdminWallets, BalanceKind } from '@platform/contracts';
import { balanceOf } from '../domain/ledger';
import type { WalletDeps } from './ports';

// "Hamyonlar" for the team (docs/12): every driver by the public id, never the Telegram ID (docs/65 A3).
const balances = (sum: (balance: BalanceKind) => number) => ({ bonus: sum('bonus'), main: sum('main') });

export async function adminWallets(deps: WalletDeps): Promise<AdminWallets['wallets']> {
  const drivers = await deps.wallet.drivers();
  const wallets = await Promise.all(
    drivers.map(async (driverId) => {
      const [operations, person] = await Promise.all([
        deps.wallet.operations(driverId),
        deps.people.find(driverId),
      ]);
      const sum = (balance: BalanceKind) => balanceOf(operations, balance);
      return { driverId: person?.publicId ?? '', firstName: person?.firstName ?? '', ...balances(sum) };
    }),
  );
  // The least money first: who has to top up soon is seen at once (G41, docs/90 F-A5).
  return wallets.sort((a, b) => a.main - b.main);
}
