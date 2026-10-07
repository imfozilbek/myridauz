import { arrivalAt, type Trip } from '@platform/contracts';
import { Tappable } from '@telegram-apps/telegram-ui';
import { useI18n } from '../context/i18n-context';
import { freeCar } from '../market/trip-filters';
import { PersonBadge } from './person-badge';

const BADGE = 26;

type Props = { readonly trip: Trip; readonly places: string | null; readonly onOpen: () => void };

// A trip in «Safarlar» (journey of path 2, screen 5): the times and the price, the free seats and how
// the driver picks up, then the driver. places: «Chilonzor → Urgut» when the search was a whole region.
export function SearchTripCard({ trip, places, onOpen }: Props) {
  const { t, formatTime, formatMoney, formatNumber } = useI18n();
  const { driver } = trip;
  const mode = trip.pickupMode === 'both' ? 'both' : trip.pickupMode === 'door' || !trip.pitak ? 'door' : 'pitak';
  const facts = [
    t('market.trip.seats', { count: String(trip.seatsLeft) }),
    trip.woman ? t('market.search.woman') : t(`find.mode.${mode}`),
    ...(freeCar(trip) ? [t('find.carPrice', { price: formatMoney(trip.price * trip.seats) })] : []),
  ];
  return (
    <Tappable Component="div" className="search-trip" onClick={onOpen}>
      <div className="search-trip-head">
        <span className="search-trip-times">
          {t('find.times', {
            from: formatTime(new Date(trip.departAt)),
            to: formatTime(new Date(arrivalAt(trip.departAt, trip.km))),
          })}
        </span>
        <span className="search-trip-price">{formatMoney(trip.price)}</span>
      </div>
      {places ? <p className="search-trip-places">{places}</p> : null}
      <p className="search-trip-facts">{facts.join(' · ')}</p>
      <div className="search-trip-driver">
        <PersonBadge id={driver.id} name={driver.firstName} hasAvatar={driver.hasAvatar} size={BADGE} />
        <span>
          {driver.rating.average === null
            ? t('find.driverNew', { name: driver.firstName, car: driver.car.model })
            : t('find.driver', {
                name: driver.firstName,
                rating: formatNumber(driver.rating.average),
                car: driver.car.model,
              })}
        </span>
      </div>
    </Tappable>
  );
}
