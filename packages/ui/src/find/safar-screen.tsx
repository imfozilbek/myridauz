import { quietly } from '@platform/api-client';
import type { Trip, UserReviews } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { useAccount } from '../account/account-context';
import { useAnalytics, useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { useAskedSeat } from '../market/asked-seat';
import { ClosedTrip } from '../market/closed-trip';
import { usePlaces } from '../market/places-gate';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';
import { AreaMap } from './area-map';
import { DriverCard } from './driver-card';
import { ReviewCard } from './review-card';
import { ReviewsScreen } from './reviews-screen';
import { RouteLine } from './route-line';
import { firstChoice, type SeatChoice } from './seat-choice';
import { SeatsCard } from './seats-card';
import { TripFacts } from './trip-facts';
import './find.css';
import './safar.css';
import './route-line.css';
import './seats.css';

type Props = {
  readonly trip: Trip;
  readonly onBack: () => void;
  readonly onBook: (choice: SeatChoice) => void;
  // A trip that takes nobody leads to the other trips of its day (docs/89 P8).
  readonly onOthers?: () => void;
};

// «Safar» of a passenger (owner decision 06.10.2026, docs/118 path 2: A with the seats of B): the
// driver on top, the way, the marks, one review, the seats and «Jami», «N ta joy band qilish».
export function SafarScreen({ trip, onBack, onBook, onOthers }: Props) {
  useScreenView('market.trip');
  useScreenBackground();
  const { track } = useAnalytics();
  const { t, formatDate, formatWeekday } = useI18n();
  const { colors } = useBrand().theme;
  const start = usePlaces().find(trip.from);
  const [choice, setChoice] = useState<SeatChoice>(() => firstChoice(trip));
  const [reviews, setReviews] = useState<UserReviews | null>(null);
  const { channels } = useApiClients();
  useEffect(() => {
    track({ name: 'trip_open', screen: 'market.trip' });
  }, [track]);
  // «N kishi koʻrdi» of the driver (G63, docs/119): once, quietly; a failure is never seen.
  useEffect(() => {
    quietly(() => channels.tripViewed(trip.id)).catch(() => undefined);
  }, [channels, trip.id]);
  // The own trip and a trip already asked are not booked again (G52, docs/112).
  const mine = useAccount()?.profile.id === trip.driver.id;
  const asked = useAskedSeat(trip.id, !mine);
  const closed =
    trip.status !== 'active'
      ? t(`market.trip.closed.${trip.status}`)
      : trip.departAt <= Date.now()
        ? t('market.trip.departed')
        : null;
  if (reviews) return <ReviewsScreen reviews={reviews} onBack={() => setReviews(null)} />;
  const day = new Date(trip.departAt);
  return (
    <div className="find safar" style={brandVars(colors)}>
      <Screen onBack={onBack} />
      <p className="safar-day">
        {t('find.dayLine', { date: formatDate(day), weekday: formatWeekday(day), km: String(trip.km) })}
      </p>
      <DriverCard trip={trip} />
      <RouteLine from={trip.from} to={trip.to} departAt={trip.departAt} km={trip.km} />
      <TripFacts trip={trip} />
      {start ? <AreaMap place={start} /> : null}
      {trip.comment ? <p className="safar-card safar-comment">{trip.comment}</p> : null}
      <ReviewCard driverId={trip.driver.id} onAll={setReviews} />
      {closed ? (
        <div className="safar-closed">
          <ClosedTrip trip={trip} reason={closed} onOthers={onOthers} />
        </div>
      ) : mine || asked ? (
        <p className="safar-note">{t(mine ? 'market.trip.yours' : 'market.trip.asked')}</p>
      ) : (
        <>
          <p className="find-head safar-head">{t('find.seatsTitle')}</p>
          <SeatsCard trip={trip} choice={choice} onChoice={setChoice} />
          <p className="safar-note">{t('find.payHint')}</p>
          <MainButton
            text={choice.wholeCar ? t('find.bookCar') : t('find.book', { count: String(choice.seats) })}
            onClick={() => onBook(choice)}
          />
        </>
      )}
    </div>
  );
}
