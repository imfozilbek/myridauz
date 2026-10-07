import type { Trip } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { fitsFilters, type TripFilters } from '../market/trip-filters';

type Props = { readonly trips: readonly Trip[]; readonly filters: TripFilters };

// Under the list (mockup screen 5): the trips «Necha kishi?» hid, by their free seats,
// «1 joyli 2 ta safar yashirildi». The person knows they exist and can take fewer people.
export function HiddenTrips({ trips, filters }: Props) {
  const { t } = useI18n();
  const hidden = new Map<number, number>();
  for (const trip of trips)
    if (trip.seatsLeft < filters.seats && fitsFilters(trip, { ...filters, seats: trip.seatsLeft }))
      hidden.set(trip.seatsLeft, (hidden.get(trip.seatsLeft) ?? 0) + 1);
  return [...hidden.entries()]
    .sort(([one], [other]) => one - other)
    .map(([seats, count]) => (
      <p key={seats} className="results-hidden">
        {t('find.hidden', { seats: String(seats), count: String(count) })}
      </p>
    ));
}
