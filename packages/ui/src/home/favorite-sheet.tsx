import { TRIP_LINK, type Booking, type Trip } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { ProfilePhoto } from '../account/profile/profile-photo';
import { Button, Modal } from '../components';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import type { HomeGo } from '../flow/start-action';
import { useNearWhenLabel } from '../market/when';
import { useDirectory } from '../places/use-directory';
import './arrived-sheet.css';

const SEEN = 'favorite-trips-seen';
const PHOTO = 72;
const KEPT = 50;

// The trips this phone already showed: per person, only a convenience (lost storage asks again).
function seen(): readonly string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(SEEN) ?? '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function markSeen(id: string) {
  try {
    localStorage.setItem(SEEN, JSON.stringify([id, ...seen()].slice(0, KEPT)));
  } catch {
    // No storage on this phone: the sheet may come again, nothing breaks.
  }
}

type Props = { readonly go: HomeGo; readonly bookings: readonly Booking[] };

// A saved driver published a trip (docs/129 «Контакты после поездки», mockup g60/7): one tap books
// it inside Rida, the way back to the same driver is easier than a call.
export function FavoriteSheet({ go, bookings }: Props) {
  const { comfort } = useApiClients();
  const [trip, setTrip] = useState<Trip | null>(null);
  useEffect(() => {
    const shown = seen();
    comfort
      .favorites()
      .then(({ trips }) =>
        setTrip(trips.find((each) => each.seatsLeft > 0 && !shown.includes(each.id)) ?? null),
      )
      .catch(() => setTrip(null));
  }, [comfort]);
  const close = (book: boolean) => {
    if (!trip) return;
    markSeen(trip.id);
    setTrip(null);
    if (book) go('find_trip', { link: { name: TRIP_LINK, id: trip.id } });
  };
  return (
    <Modal open={trip !== null} onOpenChange={(open) => (open ? undefined : close(false))}>
      {trip ? <Offer trip={trip} times={rides(bookings, trip)} onClose={close} /> : null}
    </Modal>
  );
}

// How many trips the passenger made with this driver.
const rides = (bookings: readonly Booking[], trip: Trip) =>
  bookings.filter((each) => each.status === 'completed' && each.trip.driver.id === trip.driver.id).length;

type OfferProps = { readonly trip: Trip; readonly times: number; readonly onClose: (book: boolean) => void };

function Offer({ trip, times, onClose }: OfferProps) {
  const { t, formatMoney } = useI18n();
  const when = useNearWhenLabel();
  const [places] = useDirectory();
  const name = (id: string) => (places.status === 'ready' ? (places.directory.find(id)?.name ?? '') : '');
  const { driver } = trip;
  return (
    <div className="arrived-sheet">
      <ProfilePhoto userId={driver.id} name={driver.firstName} hasAvatar={driver.hasAvatar} size={PHOTO} />
      <span className="arrived-kicker">{t('bookings.favorite.kicker')}</span>
      <b className="arrived-title">{t('bookings.favorite.title', { name: driver.firstName })}</b>
      {times > 0 ? (
        <span className="arrived-sub">{t('bookings.favorite.times', { count: times })}</span>
      ) : null}
      <span className="favorite-trip">
        <b>
          {t('bookings.favorite.when', {
            when: when(trip.departAt, Date.now()),
            from: name(trip.from),
            to: name(trip.to),
          })}
        </b>
        <span className="favorite-trip-line">
          {t('bookings.favorite.seats', { count: trip.seatsLeft })}
          <b>{formatMoney(trip.price)}</b>
        </span>
      </span>
      <Button size="l" stretched onClick={() => onClose(true)}>
        {t('bookings.favorite.book')}
      </Button>
      <Button size="l" mode="plain" stretched onClick={() => onClose(false)}>
        {t('bookings.favorite.later')}
      </Button>
    </div>
  );
}
