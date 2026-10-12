import type { Booking } from '@platform/contracts';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { useLoad } from '../market/use-list';
import { useEnds } from '../requests/ends';
import { Screen } from '../screen/screen';
import { ActionFailure } from '../states/action-failure';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { MainButton } from '../telegram/bottom-button';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';
import { RateRiders } from './rate-riders';
import { ridersOf } from './trip-sums';
import { useRateRiders } from './use-rate-riders';
import './trip-end.css';
import './rate-link.css';

type Props = {
  readonly bookingId: string;
  readonly onBack: () => void;
  // The stars went: the app closes, the driver came from the bot (docs/94 C1).
  readonly onSent: () => void;
};

// The driver rates by the link of the bot (G78 sheet 6): the stars of the whole trip, the person of
// the link on top with the stars given in the bot; the others wait for their own question.
export function RateLinkScreen({ bookingId, onBack, onSent }: Props) {
  const { bookings, feedback } = useApiClients();
  const { value, failed, reload } = useLoad(async () => {
    const [all, target] = await Promise.all([bookings.driverBookings(), feedback.target(bookingId)]);
    return { all, stars: target.mine?.stars ?? null };
  });
  const linked = value?.all.find((booking) => booking.id === bookingId);
  if (failed || (value && !linked)) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value || !linked) return <ScreenSkeleton onBack={onBack} />;
  const others = ridersOf(value.all.filter((booking) => booking.trip.id === linked.trip.id)).filter(
    (booking) => booking.id !== linked.id && booking.rated !== true,
  );
  const saved = new Map(value.stars === null ? [] : [[linked.id, value.stars]]);
  return <RateTrip riders={[linked, ...others]} saved={saved} onBack={onBack} onSent={onSent} />;
}

type TripProps = Omit<Props, 'bookingId'> & {
  // The person of the link first.
  readonly riders: readonly [Booking, ...Booking[]];
  readonly saved: ReadonlyMap<string, number>;
};

function RateTrip({ riders, saved, onBack, onSent }: TripProps) {
  useScreenView('trip_end.rate_link');
  useScreenBackground();
  const { t, formatDate } = useI18n();
  const { colors } = useBrand().theme;
  const ends = useEnds();
  const [linked] = riders;
  const rate = useRateRiders(riders, { saved, waits: (booking) => booking.id !== linked.id });
  return (
    <div className="trip-end trip-end-link" style={brandVars(colors)}>
      <Screen onBack={onBack} />
      <p className="trip-end-trip">
        {t('driverAfter.rate.trip', {
          day: formatDate(new Date(linked.trip.departAt)),
          route: t('requests.card.route', ends(linked.trip)),
        })}
      </p>
      <RateRiders riders={riders} starsOf={rate.starsOf} onChoose={rate.choose} marked={linked.id} />
      <ActionFailure error={rate.failure} />
      <MainButton text={t('reviews.send')} onClick={() => rate.send(onSent)} />
    </div>
  );
}
