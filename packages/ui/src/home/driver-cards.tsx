import { MINUTE_MS, tashkentDate, type Booking, type Trip } from '@platform/contracts';
import { useState } from 'react';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { useNow } from '../own-trip/use-now';
import { Icon } from '../icons';
import { useShortDay } from '../market/when';
import type { PlaceDirectory } from '../places/directory';
import { useRegionRoute } from '../places/region-route';
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

// The next trip of a driver on a later day (G66, mockup g66/2 phone 3): when and the seats taken, the
// route, where it starts and the price; the new requests as an amber plate.
export function DriverNextCard({ trip, bookings, directory, onOpen }: Props) {
  const { t, formatTime, formatMoney } = useI18n();
  const { colors } = useBrand().theme;
  const shortDay = useShortDay();
  const regions = useRegionRoute(directory);
  const route = (trip: Trip) => regions(trip.from, trip.to);
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
    <button type="button" className="drive-now" style={brandVars(colors)} onClick={onOpen}>
      <span className="drive-now-top">
        <span className="drive-now-pill">{t('home.meta', { when, more: seats })}</span>
        <Icon name="next" size={ARROW} color={colors.textMuted} />
      </span>
      <span className="drive-now-route">{route(trip)}</span>
      <span className="drive-now-foot">
        <span className="drive-now-note">
          {t('home.meta', { when: t('find.from', { place: start }), more: formatMoney(trip.price) })}
        </span>
        {waiting > 0 ? (
          <span className="drive-now-new">{t('home.newRequests', { count: String(waiting) })}</span>
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
  const regions = useRegionRoute(directory);
  const route = (trip: Trip) => regions(trip.from, trip.to);
  // «N daqiqadan keyin» counts down on an open screen.
  const now = useNow();
  const minutes = Math.max(0, Math.ceil((trip.departAt - now) / MINUTE_MS));
  const start = trip.pitak?.name ?? directory.find(trip.from)?.name ?? '';
  const { confirmed, waiting } = tripPeople(trip, bookings);
  const meta = (when: string, more: string) => t('home.meta', { when, more });
  const soon = meta(meta(t('home.day.in', { minutes: String(minutes) }), route(trip)), start);
  const people = t('home.day.people', { count: String(confirmed.length) });
  const state = waiting > 0 ? t('home.newRequests', { count: String(waiting) }) : t('home.day.allConfirmed');
  return (
    <button type="button" className="drive-now drive-day" style={brandVars(colors)} onClick={onOpen}>
      <span className="drive-day-time">
        {t('home.trip.when', { day: t('market.day.today'), time: formatTime(new Date(trip.departAt)) })}
      </span>
      <span className="drive-now-note">{soon}</span>
      {confirmed.length > 0 ? (
        <span className="drive-day-faces">
          {confirmed.slice(0, FACES).map((booking) => (
            <span key={booking.id} className="drive-day-face">
              {booking.passenger.firstName.slice(0, 1).toUpperCase()}
            </span>
          ))}
        </span>
      ) : null}
      <span className="drive-now-note">{meta(people, state)}</span>
    </button>
  );
}
