import { useState } from 'react';
import { useAnalytics } from '../context/analytics-context';
import { MomentStep } from '../growth/moment-step';
import { NewTripFlow } from '../market/new-trip-flow';
import { PastTripFlow } from '../trip-end/past-trip-flow';
import type { ReturnTrip } from '../trip-end/return-plan';
import { TripDoneScreen } from '../trip-end/trip-done-screen';
import { OwnTripLive } from './own-trip-live';
import type { OwnTripProps } from './own-trip-opened';
import { tripPast } from './trip-stage';

// After the trip: «Safar tugadi» once after «Yetib keldik», the celebration of a moment (G69), or
// the publishing of the way back.
type After =
  | { readonly screen: 'end' }
  | { readonly screen: 'moment'; readonly next: () => void }
  | { readonly screen: 'return'; readonly back: ReturnTrip };

// The own trip of the driver from the publishing to the end (G63, docs/118 path 6, docs/124 В):
// «Mening safarim» while it lives, «Safar tugadi» with the stars and «Qaytish» once right after the
// arrival, then the past trip at once (lead decision 08.10.2026), even before the list brings the
// mark. The way back opens the one screen of the publishing with the route the other way and the
// answers of this trip (G63 C1).
export function OwnTripFlow(props: OwnTripProps) {
  const { trip, bookings, onBack, onChanged } = props;
  const { track } = useAnalytics();
  const [after, setAfter] = useState<After | null>(props.start === 'end' ? { screen: 'end' } : null);
  const [arrived, setArrived] = useState(props.start === 'end');
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
  if (after?.screen === 'moment') return <MomentStep onDone={after.next} />;
  // «Baho berish» of the block opened the stars at once: «Назад» goes straight home (G77, A1).
  const leave = props.start === 'end' ? onBack : close;
  if (after?.screen === 'end')
    return (
      <TripDoneScreen
        trip={trip}
        bookings={bookings}
        // The stars, then the celebration «Men Rida bilan», then «Qaytish» (docs/124 В, G69).
        onPublish={(back) => setAfter({ screen: 'moment', next: () => publish(back) })}
        onClose={() => setAfter({ screen: 'moment', next: leave })}
        onRated={onChanged}
      />
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
