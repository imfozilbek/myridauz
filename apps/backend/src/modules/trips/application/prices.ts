import type { TripsDeps } from './ports';

// Enough for the median of every direction; the newest trips first, so the oldest drop out.
const REAL_PRICES_LIMIT = 5000;

// Real prices of trips that left in [from, now), not cancelled: the team's median hint (docs/09).
// A trip ahead or a cancelled one is no real price (docs/90 F-A7).
export async function realPrices(deps: TripsDeps, from: number) {
  const trips = await deps.trips.pricedBetween(from, deps.now(), REAL_PRICES_LIMIT);
  return trips.map(({ from: start, to, price }) => ({ from: start, to, price }));
}
