import { MY_TRIP_LINK } from '@platform/contracts';
import { useState } from 'react';
import { DriverActions } from '../action-sheet/driver-actions';
import type { HomeGo } from '../flow/start-action';
import { useDirectory } from '../places/use-directory';
import { Screen } from '../screen/screen';
import { DriverDayCard, DriverNextCard } from './driver-cards';
import { useDriverData, type DriverLoad } from './driver-data';
import { nextTrip, todayTrip } from './driver-day';
import { HomeFailed } from './home-state';
import { useHomeTap } from './use-home-tap';

// The main screen of a driver (G25, G66, docs/118): what is now under the profile, the trip of today
// big or the next trip with its seats and new requests (mockup g66/2). Publishing lives at the bottom.
export function DriverHome({ go }: { readonly go: HomeGo }) {
  const load = useDriverData();
  // A pull down at the top of the main screen refreshes the trips (docs/94 W1).
  return (
    <>
      <Screen onRefresh={load.refresh} />
      <Now go={go} load={load} />
      <DriverActions go={go} />
    </>
  );
}

type NowProps = { readonly go: HomeGo; readonly load: DriverLoad };

function Now({ go, load: { value, failed, reload } }: NowProps) {
  const [places, retryPlaces] = useDirectory();
  const tap = useHomeTap();
  const [now] = useState(Date.now);
  const retry = () => {
    if (failed) reload();
    if (places.status === 'error') retryPlaces();
  };
  if (failed || places.status === 'error') return <HomeFailed onRetry={retry} />;
  if (!value || places.status !== 'ready') return null;
  const [trips, bookings] = value;
  const today = todayTrip(trips, now);
  const trip = today ?? nextTrip(trips, now);
  if (!trip) return null;
  const props = {
    trip,
    bookings,
    directory: places.directory,
    onOpen: tap('item', () => go('my_trips', { link: { name: MY_TRIP_LINK, id: trip.id } })),
  };
  return today ? <DriverDayCard {...props} /> : <DriverNextCard {...props} />;
}
