import type { AdminWallets } from '@platform/contracts';
import type { WalletDeps } from './ports';

// One page of "Hamyonlar" (G42): the balances in one query, the names of this page only.
export const WALLETS_PAGE = 30;

// "Hamyonlar" for the team (docs/12): every driver by the public id, never the Telegram ID (docs/65 A3).
// The least money first: who has to top up soon is seen at once (G41, docs/90 F-A5).
export async function adminWallets(deps: WalletDeps, page: number): Promise<AdminWallets> {
  const rows = await deps.wallet.balances(page * WALLETS_PAGE, WALLETS_PAGE + 1);
  const wallets = await Promise.all(
    rows.slice(0, WALLETS_PAGE).map(async ({ driverId, bonus, main }) => {
      const person = await deps.people.find(driverId);
      return { driverId: person?.publicId ?? '', firstName: person?.firstName ?? '', bonus, main };
    }),
  );
  return { wallets, more: rows.length > WALLETS_PAGE };
}
