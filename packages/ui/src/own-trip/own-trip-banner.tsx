import { arrivalAt, type Trip } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { usePlaces } from '../market/places-gate';
import { usePlaceNames } from '../places/place-names';
import { minutesLeft, type TripStage } from './trip-stage';
import './own-trip-banner.css';

// The clock of a published trip and the tick of the green plates (mockup g63/3).
const CLOCK = 16;
const TICK = 18;

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
  const { toward } = usePlaceNames(directory);
  const end = directory.find(trip.to);
  const place = end ? toward(end) : trip.to;
  const [title, line] =
    stage === 'published'
      ? [t('driverTrip.published.title'), t('driverTrip.published.sub')]
      : stage === 'soon'
        ? [
            t('driverTrip.soon.title', { minutes: String(minutesLeft(trip, now)) }),
            t('driverTrip.soon.sub', { passengers: String(riders), seats: String(trip.seatsLeft) }),
          ]
        : stage === 'on_way'
          ? [
              t('driverTrip.onWay.title'),
              // The text picks the ending of the place by its last letter: «Oltiariqqa», «Samarqandga».
              t('driverTrip.onWay.sub', {
                place,
                last: place.slice(-1),
                time: formatTime(new Date(arrivalAt(trip.departAt, trip.km))),
              }),
            ]
          : [t(trip.status === 'cancelled' ? 'market.trip.cancelled' : 'bookings.done.title'), null];
  return (
    <div className="own-banner" data-stage={stage}>
      {stage === 'published' ? <Icon name="waiting" size={CLOCK} /> : <Icon name="selected" size={TICK} />}
      <span className="own-banner-text">
        <b>{title}</b>
        {line ? <span>{line}</span> : null}
      </span>
    </div>
  );
}
