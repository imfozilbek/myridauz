import type { WalletDeps } from './ports';
import { grantWelcome } from './wallet';

// The Cron job: an approved driver with an empty journal gets bonus 1 now (docs/12). It covers
// drivers approved before wallets existed and an approval whose grant did not go through.
export async function grantMissedWelcome(deps: WalletDeps, approved: readonly number[]): Promise<void> {
  const known = new Set(await deps.wallet.drivers());
  for (const driverId of approved) if (!known.has(driverId)) await grantWelcome(deps, driverId);
}
