import { DAY_MS, FEW_SEATS } from '@platform/contracts';
import { balanceOf, type Operation } from '../domain/ledger';
import type { WalletDeps } from './ports';
import { walletView } from './wallet-view';

// The bonus warning comes 3 days before its end (docs/122): the daily Cron sees each end once, in
// the day that starts 3 days before it.
const WARN_FROM_MS = 2 * DAY_MS;
const WARN_TO_MS = 3 * DAY_MS;

const money = (operations: readonly Operation[]) =>
  balanceOf(operations, 'bonus') + balanceOf(operations, 'main');

// After a commission: the money went under 5 seats at the price of the last trip (G68, docs/122).
// Said once, when it crosses the line; a driver without a trip yet hears nothing.
export async function tellFewSeats(
  deps: WalletDeps,
  driverId: number,
  before: readonly Operation[],
  after: readonly Operation[],
): Promise<void> {
  const price = await deps.lastPrice(driverId);
  if (price === null) return;
  const seats = (operations: readonly Operation[]) => Math.floor(money(operations) / deps.perSeat(price));
  if (seats(before) < FEW_SEATS || seats(after) >= FEW_SEATS) return;
  await deps.tell(driverId, await walletView(deps, driverId), 'fewSeats');
}

// The daily Cron job: the bonus ends in 3 days, once (G68, docs/122). A bonus given later moves its
// end: only the drivers whose bonus really ends in the window hear it.
export async function warnBonusEnds(deps: WalletDeps): Promise<void> {
  const now = deps.now();
  const from = now + WARN_FROM_MS;
  const to = now + WARN_TO_MS;
  for (const driverId of await deps.wallet.bonusEndsBetween(from, to)) {
    const view = await walletView(deps, driverId);
    const ends = view.bonusExpiresAt;
    if (view.bonus > 0 && ends !== null && ends > from && ends <= to)
      await deps.tell(driverId, view, 'bonusEnds');
  }
}
