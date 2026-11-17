import { arrivalAt, tripMarks, type Trip } from '@platform/contracts';
import { Tappable } from '@telegram-apps/telegram-ui';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { usePlacesIfAny } from '../market/places-gate';
import { freeCar } from '../market/trip-filters';
import { useFitLine } from '../screen/fit-line';
import { useTripTime } from '../trip/trip-time';
import { PersonBadge } from './person-badge';

const BADGE = 22;

type Props = { readonly trip: Trip; readonly onOpen: () => void };

// A trip in «Safarlar» (journey of path 2, screen 5): the times and the price, where the driver goes
// from and to (G100: a search of a whole region), the free seats and how the driver picks up, the driver.
export function SearchTripCard({ trip, onOpen }: Props) {
  const { t, formatTime, formatMoney, formatRating } = useI18n();
  const tripTime = useTripTime();
  const { driver } = trip;
  const places = usePlacesIfAny();
  const from = places?.find(trip.from);
  const to = places?.find(trip.to);
  const way = from && to ? t('common.route', { from: from.name, to: to.name }) : '';
  const fitted = useFitLine<HTMLParagraphElement>(way);
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
          {/* A range «08:00 … 10:00» shows no arrival (G90, mockup g90/5). */}
          {trip.departUntil === null
            ? t('find.times', {
                from: formatTime(new Date(trip.departAt)),
                to: formatTime(new Date(arrivalAt(trip.departAt, trip.km))),
              })
            : tripTime(trip)}
        </span>
        <span className="search-trip-price">{formatMoney(trip.price)}</span>
      </div>
      {way ? (
        <p ref={fitted} className="search-trip-way">
          {way}
        </p>
      ) : null}
      <p className="search-trip-facts">{facts.join(' · ')}</p>
      <div className="search-trip-driver">
        <PersonBadge
          id={driver.id}
          name={driver.firstName}
          hasAvatar={driver.hasAvatar}
          size={BADGE}
          role="driver"
        />
        {driver.rating.average === null ? (
          // No reviews yet: «yangi», not an empty place where the stars are (G100).
          <span>
            {driver.firstName} <span className="search-trip-new">{t('find.newDriver')}</span>{' '}
            {t('find.driverCar', { car: driver.car.model })}
          </span>
        ) : (
          <span>
            {t('find.driver', {
              name: driver.firstName,
              rating: formatRating(driver.rating.average),
              car: driver.car.model,
            })}
          </span>
        )}
      </div>
    </Tappable>
  );
}
