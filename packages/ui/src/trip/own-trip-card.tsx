import { arrivalAt, tashkentDate, type BookingRule, type Trip } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useI18n } from '../context/i18n-context';
import { usePlaces } from '../market/places-gate';
import { useShortDay } from '../market/when';
import { TripPoint, TripRoad } from './trip-point';
import './trip-card.css';
import './own-trip-card.css';

// The short name of the way a trip is booked, at the right of the seats (mockup g63/3).
const RULE_LABEL = {
  seats: 'market.rule.seats',
  seats_or_car: 'driverTrip.rule.seatsOrCar',
  car_only: 'market.rule.carOnly',
} as const satisfies Record<BookingRule, TranslationKey>;

// The card of the own trip for its driver (owner decision 06.10.2026, mockup g63/3, journey screen
// 6): the same card as on a booking, from the trip itself. The pitak or the district with the day and
// time, the road, the end with the arrival; then the free seats with the price and the rule.
export function OwnTripCard({ trip }: { readonly trip: Trip }) {
  const { t, formatTime, formatNumber } = useI18n();
  const directory = usePlaces();
  const shortDay = useShortDay();
  const placeName = (id: string) => directory.find(id)?.name ?? id;
  const when = t('driverTrip.when', {
    day: shortDay(tashkentDate(trip.departAt), Date.now()),
    time: formatTime(new Date(trip.departAt)),
  });
  const arrives = t('market.trip.arrival', { time: formatTime(new Date(arrivalAt(trip.departAt, trip.km))) });
  const price = formatNumber(trip.price);
  return (
    <div className="trip-sheet trip-sheet-own">
      <div className="trip-card-way">
        <TripPoint kind="from" name={trip.pitak?.name ?? placeName(trip.from)} note={when} />
        <TripRoad km={trip.km} />
        <TripPoint kind="to" name={placeName(trip.to)} note={arrives} />
      </div>
      {/* The trip of one «Boʻsh salon kerak» request: the whole car and its sum (mockup g64/3). */}
      {trip.private ? (
        <div className="trip-card-sum">
          <span>{t('driverTrip.private.salon', { count: String(trip.seats) })}</span>
          <b>{formatNumber(trip.price * trip.seats)}</b>
        </div>
      ) : (
        <div className="trip-card-sum">
          <span>
            {trip.seatsLeft > 0
              ? t('driverTrip.free', { count: String(trip.seatsLeft), price })
              : t('driverTrip.full', { price })}
          </span>
          <span className="trip-sheet-rule">{t(RULE_LABEL[trip.bookingRule])}</span>
        </div>
      )}
    </div>
  );
}
