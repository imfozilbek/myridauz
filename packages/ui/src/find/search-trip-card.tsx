import { arrivalAt, tripMarks, type Trip } from '@platform/contracts';
import { Tappable } from '@telegram-apps/telegram-ui';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { freeCar } from '../market/trip-filters';
import { PersonBadge } from './person-badge';

const BADGE = 22;

type Props = { readonly trip: Trip; readonly onOpen: () => void };

// A trip in «Safarlar» (journey of path 2, screen 5): the times and the price, the free seats and how
// the driver picks up, then the driver.
export function SearchTripCard({ trip, onOpen }: Props) {
  const { t, formatTime, formatMoney, formatNumber } = useI18n();
  const { driver } = trip;
  const mode =
    trip.pickupMode === 'both' ? 'both' : trip.pickupMode === 'door' || !trip.pitak ? 'door' : 'pitak';
  const facts = [
    t('market.trip.seats', { count: String(trip.seatsLeft) }),
    trip.woman ? t('market.search.woman') : t(`find.cardMode.${mode}`),
    ...(freeCar(trip) ? [t('find.carPrice', { price: formatMoney(trip.price * trip.seats) })] : []),
  ];
  // «Tez orada joʻnaydi» and «Narxi tushdi» lead the card (G39, docs/104).
  const marks = tripMarks(trip, Date.now());
  return (
    <Tappable Component="div" className="search-trip" onClick={onOpen}>
      {marks.length > 0 ? (
        <p className="search-trip-marks">
          {marks.map((mark) => (
            <span key={mark} className="search-trip-mark">
              <Icon name={mark === 'soon' ? 'waiting' : 'cheaper'} size={14} />
              {t(`market.mark.${mark}`)}
            </span>
          ))}
        </p>
      ) : null}
      <div className="search-trip-head">
        <span className="search-trip-times">
          {t('find.times', {
            from: formatTime(new Date(trip.departAt)),
            to: formatTime(new Date(arrivalAt(trip.departAt, trip.km))),
          })}
        </span>
        <span className="search-trip-price">{formatMoney(trip.price)}</span>
      </div>
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
