import { formatPlate, tashkentDate, type Trip } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { PersonBadge } from '../find/person-badge';
import { useLoad } from '../market/use-list';
import { useShortDay } from '../market/when';
import { usePlaceNames } from '../places/place-names';
import { useDirectory } from '../places/use-directory';
import type { PlaceDirectory } from '../places/directory';

const FACE = 38;
const LETTER = 16;
const STATE: Record<Trip['status'], TranslationKey> = {
  active: 'market.status.open',
  full: 'market.status.full',
  completed: 'bookings.done.title',
  cancelled: 'market.status.cancelled',
};

// The trip of a complaint as path 3 shows it (mockup g67/2 screen 4): when and its state, the
// driver and where to, the car and its plate. The team never calls or writes from here (docs/07).
export function ComplaintTrip({ tripId }: { readonly tripId: string }) {
  const { market } = useApiClients();
  const { value } = useLoad(() => market.trip(tripId));
  const [places] = useDirectory();
  if (!value || places.status !== 'ready') return null;
  return <TripCard trip={value} directory={places.directory} />;
}

function TripCard({ trip, directory }: { readonly trip: Trip; readonly directory: PlaceDirectory }) {
  const { t, formatTime } = useI18n();
  const names = usePlaceNames(directory);
  const shortDay = useShortDay();
  const [now] = useState(Date.now);
  const { driver } = trip;
  const to = directory.find(trip.to);
  const when = t('home.trip.when', {
    day: shortDay(tashkentDate(trip.departAt), now),
    time: formatTime(new Date(trip.departAt)),
  });
  const car = t('home.trip.car', { model: driver.car.model, color: t(`drivers.color.${driver.car.color}`) });
  return (
    <div className="case-card case-trip">
      <span className="case-trip-pill">{t('home.meta', { when, more: t(STATE[trip.status]) })}</span>
      <span className="case-trip-who">
        <PersonBadge
          id={driver.id}
          name={driver.firstName}
          hasAvatar={false}
          size={FACE}
          letter={LETTER}
          plain
        />
        <span className="navbat-words">
          <b className="case-trip-name">
            {to ? t('home.meta', { when: driver.firstName, more: names.toward(to) }) : driver.firstName}
          </b>
          <span className="case-muted">
            {driver.car.plate ? t('home.meta', { when: car, more: formatPlate(driver.car.plate) }) : car}
          </span>
        </span>
      </span>
    </div>
  );
}
