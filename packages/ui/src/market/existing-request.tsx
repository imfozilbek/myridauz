import type { RideRequest } from '@platform/contracts';
import { useEffect } from 'react';
import { PassengerOpen } from '../bookings/passenger-open';
import { useApiClients } from '../context/api-clients';
import { useSharedPassengerData } from '../home/passenger-data';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import type { PlaceDirectory } from '../places/directory';
import { PlacesGate, usePlaces } from './places-gate';
import { useLoad } from './use-list';

type Props = {
  readonly from: string;
  readonly to: string;
  readonly date: string;
  readonly onClose: () => void;
};

// The open request on this route and day: one per day (G37, docs/101 R5). A whole region of the route
// holds the district the point gave the request (G78 П9, lesson 309).
export const openOn =
  ({ from, to, date }: Pick<Props, 'from' | 'to' | 'date'>, find: PlaceDirectory['find']) =>
  (item: RideRequest) => {
    const inside = (place: string, end: string) => place === end || find(place)?.parentId === end;
    return item.status === 'open' && inside(item.from, from) && inside(item.to, to) && item.date === date;
  };

// The open request of the person on this route and day, with its offers: a second one is never
// left (G37, docs/101 R5). Gone meanwhile (ended or cancelled): back to the check, the lists of
// the main screen fresh, so the check does not open it again (G79 П10).
export function ExistingRequest(props: Props) {
  return (
    <PlacesGate onBack={props.onClose}>
      <Existing {...props} />
    </PlacesGate>
  );
}

function Existing({ from, to, date, onClose }: Props) {
  const places = usePlaces();
  const { market, bookings } = useApiClients();
  const shared = useSharedPassengerData();
  const { value, failed, reload, refresh } = useLoad(() =>
    Promise.all([market.myRequests(), bookings.myOffers()]),
  );
  const request = value?.[0].find(openOn({ from, to, date }, places.find));
  const gone = value !== null && !request;
  useEffect(() => {
    if (!gone) return;
    void shared?.refresh();
    onClose();
  }, [gone, onClose, shared]);
  if (failed) return <ErrorScreen onRetry={reload} onBack={onClose} />;
  if (!value || !request) return <ScreenSkeleton onBack={onClose} />;
  // A request or an offer changed meanwhile: they come fresh at once (G52, docs/112).
  return (
    <PassengerOpen
      opened={{ kind: 'request', request }}
      offers={value[1]}
      onClose={onClose}
      onStale={() => void refresh()}
    />
  );
}
