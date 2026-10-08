import { useState } from 'react';
import { useAnalytics } from '../context/analytics-context';
import { NewTripFlow } from '../market/new-trip-flow';
import { PastTripFlow } from '../trip-end/past-trip-flow';
import type { ReturnTrip } from '../trip-end/return-plan';
import { TripEndFlow } from '../trip-end/trip-end-flow';
import { OwnTripLive, type OwnTripProps } from './own-trip-live';
import { tripPast } from './trip-stage';

// After the trip: «Safar tugadi» once after «Yetib keldik», or the publishing of the way back.
type After = { readonly screen: 'end' } | { readonly screen: 'return'; readonly back: ReturnTrip };

// The own trip of the driver from the publishing to the end (G63, docs/118 path 6, docs/124 В):
// «Mening safarim» while it lives, «Safar tugadi» with the stars and «Qaytish» once right after the
// arrival, then the past trip at once (lead decision 08.10.2026), even before the list brings the
// mark. The way back opens the one screen of the publishing with the route the other way and the
// answers of this trip (G63 C1).
export function OwnTripFlow(props: OwnTripProps) {
  const { trip, bookings, onBack, onChanged } = props;
  const { track } = useAnalytics();
  const [after, setAfter] = useState<After | null>(null);
  const [arrived, setArrived] = useState(false);
  const close = () => setAfter(null);
  const publish = (back: ReturnTrip) => setAfter({ screen: 'return', back });
  if (after?.screen === 'return')
    return (
      <NewTripFlow
        route={after.back.route}
        again={after.back.again}
        onBack={close}
        // Counted once the way back is out (G18, docs/29).
        onPublished={() => track({ name: 'return_trip_created', screen: 'market.publish' })}
      />
    );
  if (after?.screen === 'end')
    return (
      <TripEndFlow trip={trip} bookings={bookings} onPublish={publish} onClose={close} onRated={onChanged} />
    );
  if (arrived || tripPast(trip))
    return (
      <PastTripFlow
        trip={trip}
        bookings={bookings}
        onBack={onBack}
        onChanged={onChanged}
        onPublish={publish}
      />
    );
  const end = () => {
    setArrived(true);
    setAfter({ screen: 'end' });
  };
  return <OwnTripLive {...props} onArrived={end} />;
}
