import { tashkentDate, TRIP_LINK, type Booking, type Trip } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { Button, Modal } from '../components';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import type { HomeGo } from '../flow/start-action';
import { today, tomorrow } from '../market/when';
import { useDirectory } from '../places/use-directory';
import { useSheetShown } from '../telegram/sheet-shown';
import { brandVars } from '../theme/brand-vars';
import { SheetFace } from './sheet-face';
import { SheetOverlay } from './sheet-overlay';
import './arrived-sheet.css';

const SEEN = 'favorite-trips-seen';
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
  useSheetShown(trip !== null);
  useEffect(() => {
    // Shown already, or a trip the passenger has a seat on: nothing to offer.
    const shown = [...seen(), ...bookings.map((booking) => booking.trip.id)];
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
    <Modal
      overlayComponent={<SheetOverlay />}
      open={trip !== null}
      onOpenChange={(open) => (open ? undefined : close(false))}
    >
      {trip ? <Offer trip={trip} times={rides(bookings, trip)} onClose={close} /> : null}
    </Modal>
  );
}

// How many trips the passenger made with this driver.
const rides = (bookings: readonly Booking[], trip: Trip) =>
  bookings.filter((each) => each.status === 'completed' && each.trip.driver.id === trip.driver.id).length;

type OfferProps = { readonly trip: Trip; readonly times: number; readonly onClose: (book: boolean) => void };

function Offer({ trip, times, onClose }: OfferProps) {
  const { t, formatNumber, formatTime, formatDate } = useI18n();
  const { colors } = useBrand().theme;
  const dayOf = (at: number) => {
    const date = tashkentDate(at);
    const now = Date.now();
    if (date === today(now)) return t('market.day.today');
    return date === tomorrow(now) ? t('market.day.tomorrow') : formatDate(new Date(at));
  };
  const [places] = useDirectory();
  // The regions of the ends, as on the mockup g60/7: «Toshkent shahri → Samarqand viloyati».
  const name = (id: string) => {
    if (places.status !== 'ready') return '';
    const place = places.directory.find(id);
    return (place?.parentId ? places.directory.find(place.parentId) : place)?.name ?? '';
  };
  const { driver } = trip;
  return (
    <div className="arrived-sheet" style={brandVars(colors)}>
      <SheetFace id={driver.id} name={driver.firstName} hasAvatar={driver.hasAvatar} badge="favorite" />
      <span className="arrived-kicker">{t('bookings.favorite.kicker')}</span>
      <b className="arrived-title">{t('bookings.favorite.title', { name: driver.firstName })}</b>
      {times > 0 ? (
        <span className="arrived-sub">{t('bookings.favorite.times', { count: times })}</span>
      ) : null}
      <span className="favorite-trip">
        <b>
          {t('bookings.favorite.when', {
            day: dayOf(trip.departAt),
            time: formatTime(new Date(trip.departAt)),
            from: name(trip.from),
            to: name(trip.to),
          })}
        </b>
        <span className="favorite-trip-line">
          {t('bookings.favorite.seats', { count: trip.seatsLeft })}
          <b>{formatNumber(trip.price)}</b>
        </span>
      </span>
      <Button size="l" stretched className="sheet-main" onClick={() => onClose(true)}>
        {t('bookings.favorite.book')}
      </Button>
      <Button size="l" mode="plain" stretched className="sheet-later" onClick={() => onClose(false)}>
        {t('bookings.favorite.later')}
      </Button>
    </div>
  );
}
