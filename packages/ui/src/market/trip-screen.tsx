import { arrivalAt, type PersonId, type Trip } from '@platform/contracts';
import { useEffect, type ReactNode } from 'react';
import { useAnalytics, useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { PersonReviews } from '../feedback/driver-reviews';
import { ManageGroup, ManagePage, ManageRow } from '../manage/manage-page';
import { useTripTime } from '../trip/trip-time';
import { otherPrice } from './other-price';
import { usePlaceLabel } from './places-gate';
import { TripDriver } from './trip-driver';
import { useWayText } from './way-line';

type TripScreenProps = {
  readonly trip: Trip;
  readonly onBack: () => void;
  // The card of the driver or of a passenger (G78 sheet 4).
  readonly onPerson: (id: PersonId) => void;
  // The bookings of the trip for the team (G08).
  readonly children?: ReactNode;
};

// Everything about one trip for the team, with its bookings: no booking, no cancel (owner decision
// 29.09.2026, docs/35). Short rows in the look of «Boshqaruv», then the driver, the passengers and
// the reviews of the driver (G78 sheet 4). A passenger sees «Safar» (find/safar-screen.tsx, G59).
export function TripScreen({ trip, onBack, onPerson, children }: TripScreenProps) {
  useScreenView('market.trip');
  const { track } = useAnalytics();
  const { t, formatMoney, formatDate, formatWeekday, formatTime, formatNumber } = useI18n();
  const tripTime = useTripTime();
  const way = useWayText();
  const place = usePlaceLabel();
  const day = new Date(trip.departAt);
  useEffect(() => {
    track({ name: 'trip_open', screen: 'market.trip' });
  }, [track]);
  // A range «08:00 … 10:00» shows no arrival (G90, docs/216).
  const times =
    trip.departUntil === null
      ? t('common.route', {
          from: formatTime(day),
          to: t('market.trip.arrival', { time: formatTime(new Date(arrivalAt(trip.departAt, trip.km))) }),
        })
      : tripTime(trip);
  const recommended = otherPrice(trip);
  return (
    <ManagePage
      title={t('market.date.other', { date: formatDate(day), weekday: formatWeekday(day) })}
      onBack={onBack}
    >
      <ManageGroup>
        <ManageRow
          icon="trip"
          title={t('common.route', { from: place(trip.from).name, to: place(trip.to).name })}
          hint={t('home.meta', { when: times, more: t('market.trip.km', { km: String(trip.km) }) })}
        />
        <ManageRow icon="fact" title={t('market.review.seats')} value={formatNumber(trip.seatsLeft)} />
        <ManageRow icon="fact" title={t('market.review.price')} value={formatMoney(trip.price)} />
        {recommended === null ? null : (
          <ManageRow icon="fact" title={t('market.trip.recommended')} value={formatMoney(recommended)} />
        )}
        {trip.woman ? <ManageRow icon="fact" title={t('market.search.woman')} /> : null}
        <ManageRow icon="fact" title={way(trip)} />
        {trip.comment ? (
          <ManageRow icon="fact" title={t('market.review.comment')} hint={trip.comment} />
        ) : null}
        <ManageRow icon="state" title={t('market.review.status')} value={t(`market.status.${trip.status}`)} />
      </ManageGroup>
      <TripDriver trip={trip} onOpen={() => onPerson(trip.driver.id)} />
      {children}
      <PersonReviews key={trip.driver.id} userId={trip.driver.id} />
    </ManagePage>
  );
}
