import { MINUTE_MS, tashkentDate, type Booking, type Location, type Trip } from '@platform/contracts';
import { useState } from 'react';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { useShortDay } from '../market/when';
import type { PlaceDirectory } from '../places/directory';
import { usePlaceNames } from '../places/place-names';
import { brandVars } from '../theme/brand-vars';
import { tripPeople } from './driver-day';
import './driver-cards.css';

const ARROW = 14;
const FACES = 4;

type Props = {
  readonly trip: Trip;
  readonly bookings: readonly Booking[];
  readonly directory: PlaceDirectory;
  readonly onOpen: () => void;
};

// «Toshkent → Samarqand»: the regions of the ends by their short names (mockup g66/2).
function useRegions(directory: PlaceDirectory) {
  const { t } = useI18n();
  const { short } = usePlaceNames(directory);
  const region = (id: string) => {
    const place = directory.find(id);
    const top: Location | undefined = place?.parentId ? directory.find(place.parentId) : place;
    return top ? short(top) : '';
  };
  return (trip: Trip) => t('common.route', { from: region(trip.from), to: region(trip.to) });
}

// The next trip of a driver on a later day (G66, mockup g66/2 phone 3): when and the seats taken, the
// route, where it starts and the price; the new requests as an amber plate.
export function DriverNextCard({ trip, bookings, directory, onOpen }: Props) {
  const { t, formatTime, formatMoney } = useI18n();
  const { colors } = useBrand().theme;
  const shortDay = useShortDay();
  const route = useRegions(directory);
  const [now] = useState(Date.now);
  const day = shortDay(tashkentDate(trip.departAt), now);
  const when = t('home.trip.when', { day, time: formatTime(new Date(trip.departAt)) });
  const seats = t('home.trip.seats', {
    taken: String(trip.seats - trip.seatsLeft),
    seats: String(trip.seats),
  });
  const start = trip.pitak?.name ?? directory.find(trip.from)?.name ?? '';
  const { waiting } = tripPeople(trip, bookings);
  return (
    <button type="button" className="driver-card" style={brandVars(colors)} onClick={onOpen}>
      <span className="driver-card-top">
        <span className="driver-card-pill">{t('home.meta', { when, more: seats })}</span>
        <Icon name="next" size={ARROW} color={colors.textMuted} />
      </span>
      <span className="driver-card-route">{route(trip)}</span>
      <span className="driver-card-foot">
        <span className="driver-card-note">
          {t('home.meta', { when: t('find.from', { place: start }), more: formatMoney(trip.price) })}
        </span>
        {waiting > 0 ? (
          <span className="driver-card-new">{t('home.newRequests', { count: String(waiting) })}</span>
        ) : null}
      </span>
    </button>
  );
}

// The day of the trip (mockup g66/2 phone 4): the time big, how soon, the route and the start, the
// faces of the passengers and whether all of them are confirmed.
export function DriverDayCard({ trip, bookings, directory, onOpen }: Props) {
  const { t, formatTime } = useI18n();
  const { colors } = useBrand().theme;
  const route = useRegions(directory);
  const [now] = useState(Date.now);
  const minutes = Math.max(0, Math.ceil((trip.departAt - now) / MINUTE_MS));
  const start = trip.pitak?.name ?? directory.find(trip.from)?.name ?? '';
  const { confirmed, waiting } = tripPeople(trip, bookings);
  const meta = (when: string, more: string) => t('home.meta', { when, more });
  const soon = meta(meta(t('home.day.in', { minutes: String(minutes) }), route(trip)), start);
  const people = t('home.day.people', { count: String(confirmed.length) });
  const state = waiting > 0 ? t('home.newRequests', { count: String(waiting) }) : t('home.day.allConfirmed');
  return (
    <button type="button" className="driver-card driver-day" style={brandVars(colors)} onClick={onOpen}>
      <span className="driver-day-time">
        {t('home.trip.when', { day: t('market.day.today'), time: formatTime(new Date(trip.departAt)) })}
      </span>
      <span className="driver-card-note">{soon}</span>
      {confirmed.length > 0 ? (
        <span className="driver-day-faces">
          {confirmed.slice(0, FACES).map((booking) => (
            <span key={booking.id} className="driver-day-face">
              {booking.passenger.firstName.slice(0, 1).toUpperCase()}
            </span>
          ))}
        </span>
      ) : null}
      <span className="driver-card-note">{meta(people, state)}</span>
    </button>
  );
}
