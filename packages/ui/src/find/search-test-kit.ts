import type { MarketClient } from '@platform/api-client';
import { DAY_MS, tashkentDate, type TripDays } from '@platform/contracts';
import { fireEvent, screen } from '@testing-library/react';
import { tap } from '../market/market-test-kit';

// Test helper of the search of G59: the main directions from Toshkent, a week of days and the way
// to a place by «Boshqa joy».
export const weekOf = (counts: readonly number[]): TripDays => ({
  km: 320,
  days: Array.from({ length: 7 }, (_, index) => ({
    date: tashkentDate(Date.now() + index * DAY_MS),
    trips: counts[index] ?? 0,
  })),
  places: [{ to: '1730401', trips: counts.reduce((sum, count) => sum + count, 0) }].filter(
    (place) => place.trips > 0,
  ),
});

export const searchMarket = (
  counts: readonly number[] = [1, 0],
): Pick<MarketClient, 'directions' | 'tripDays'> => ({
  directions: async () => [{ to: '1730', today: 2, tomorrow: 5, price: 95000 }],
  tripDays: async () => weekOf(counts),
});

// «Qayerdan» is not known on a new phone: Chilonzor from the list, then Fargʻona shahri by
// «Boshqa joy», or the whole Fargʻona region by its card.
export async function findRoute(wholeRegion = false) {
  await tap('Toshkent shahri');
  await tap('Chilonzor');
  return wholeRegion ? tap('Fargʻona') : findTo();
}

// Fargʻona shahri by «Boshqa joy» once «Qayerdan» is known.
export async function findTo() {
  await tap('Boshqa joy: tuman yoki shahar');
  fireEvent.change(screen.getByPlaceholderText('Boshqa joy: tuman yoki shahar'), {
    target: { value: 'Farg' },
  });
  return fireEvent.click(await screen.findByText('ona shahri', { exact: false }));
}
