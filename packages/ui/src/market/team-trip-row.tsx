import type { Trip } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { ManageRow } from '../manage/manage-page';
import { tripPast } from '../own-trip/trip-stage';
import { usePlaceLabel } from './places-gate';
import { useTripTime } from '../trip/trip-time';

// One trip of «Safarlar» for the team (G78 sheet 4, mockup g67/1): the way, then the time, the driver
// and the state under it, the price on the right.
export function TeamTripRow({ trip, onOpen }: { readonly trip: Trip; readonly onOpen: () => void }) {
  const { t, formatNumber } = useI18n();
  const tripTime = useTripTime();
  const place = usePlaceLabel();
  // A trip the driver arrived on is over before the server closes it (lead decision 08.10.2026).
  const status = tripPast(trip) ? 'completed' : trip.status;
  const who = t('home.meta', { when: trip.driver.firstName, more: t(`market.status.${status}`) });
  return (
    <ManageRow
      icon="trip"
      title={t('common.route', { from: place(trip.from).name, to: place(trip.to).name })}
      hint={t('home.meta', { when: tripTime(trip), more: who })}
      value={formatNumber(trip.price)}
      onClick={onOpen}
    />
  );
}
