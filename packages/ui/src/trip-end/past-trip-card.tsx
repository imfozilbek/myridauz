import { arrivalAt, roadMs, type BookingRule, type Trip } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useI18n } from '../context/i18n-context';
import { usePlaces } from '../market/places-gate';
import '../trip/trip-card.css';
import './past-trip-card.css';

const HOUR_MS = 60 * 60 * 1000;
// The short name of the way a trip is booked, at the right of the seats (mockup g63/5 phone 5).
const RULE = {
  seats: 'market.rule.seats',
  seats_or_car: 'driverAfter.past.seatsOrCar',
  car_only: 'market.rule.carOnly',
} as const satisfies Record<BookingRule, TranslationKey>;

// The own trip on its past page (mockup g63/5 phone 5): the pitak or the district with the day and
// the time, the road, the end with the arrival; then the seats with the price and the rule.
export function PastTripCard({ trip }: { readonly trip: Trip }) {
  const { t, formatDate, formatTime, formatNumber } = useI18n();
  const directory = usePlaces();
  const name = (id: string) => directory.find(id)?.name ?? id;
  const time = (ms: number) => formatTime(new Date(ms));
  const price = formatNumber(trip.price);
  const hours = String(Math.round(roadMs(trip.km) / HOUR_MS));
  const point = (kind: 'from' | 'to', place: string, note: string) => (
    <div className={`trip-card-point trip-card-${kind}`}>
      <span className="trip-card-dot" aria-hidden />
      <span className="trip-card-names">
        <span className="trip-card-name">{place}</span>
        <span className="trip-card-note">{note}</span>
      </span>
    </div>
  );
  return (
    <div className="trip-sheet past-trip-sheet">
      <div className="trip-card-way">
        {point(
          'from',
          trip.pitak?.name ?? name(trip.from),
          t('driverAfter.past.when', { day: formatDate(new Date(trip.departAt)), time: time(trip.departAt) }),
        )}
        <span className="trip-card-road">{t('find.road', { km: String(trip.km), hours })}</span>
        {point(
          'to',
          name(trip.to),
          t('market.trip.arrival', { time: time(arrivalAt(trip.departAt, trip.km)) }),
        )}
      </div>
      <div className="trip-card-sum">
        <span>
          {trip.seatsLeft > 0
            ? t('driverAfter.past.free', { count: String(trip.seatsLeft), price })
            : t('driverAfter.past.full', { price })}
        </span>
        <span className="past-trip-rule">{t(RULE[trip.bookingRule])}</span>
      </div>
    </div>
  );
}
