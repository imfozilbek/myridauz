import { arrivalAt, type Trip } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { usePlaces } from '../market/places-gate';
import { minutesLeft, type TripStage } from './trip-stage';

type Props = {
  readonly trip: Trip;
  readonly stage: TripStage;
  // The seats of the confirmed passengers: «3 yoʻlovchi tasdiqlangan».
  readonly riders: number;
  readonly now: number;
};

// The plate on top of «Mening safarim» (mockup g63/3): amber while people look for the trip, green
// in the hour before the departure and on the way, grey once the trip is over or cancelled.
export function OwnTripBanner({ trip, stage, riders, now }: Props) {
  const { t, formatTime } = useI18n();
  const directory = usePlaces();
  const [title, line] =
    stage === 'published'
      ? [t('market.published.title'), t('driverTrip.published.sub')]
      : stage === 'soon'
        ? [
            t('driverTrip.soon.title', { minutes: String(minutesLeft(trip, now)) }),
            t('driverTrip.soon.sub', { passengers: String(riders), seats: String(trip.seatsLeft) }),
          ]
        : stage === 'on_way'
          ? [
              t('driverTrip.onWay.title'),
              t('driverTrip.onWay.sub', {
                place: directory.find(trip.to)?.name ?? trip.to,
                time: formatTime(new Date(arrivalAt(trip.departAt, trip.km))),
              }),
            ]
          : [t(trip.status === 'cancelled' ? 'market.trip.cancelled' : 'bookings.done.title'), null];
  return (
    <div className="own-banner" data-stage={stage}>
      <Icon name={stage === 'published' ? 'waiting' : 'selected'} size={16} />
      <span className="own-banner-text">
        <b>{title}</b>
        {line ? <span>{line}</span> : null}
      </span>
    </div>
  );
}
