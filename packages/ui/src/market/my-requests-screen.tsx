import {
  BOOKING_LINK,
  REQUEST_LINK,
  type AppLink,
  type Booking,
  type RideRequest,
} from '@platform/contracts';
import { useState } from 'react';
import { useScreenView } from '../context/analytics-context';
import { PassengerOpen, type Opened } from '../bookings/passenger-open';
import { useFreshLists } from '../home/fresh-lists';
import { PassengerData, usePassengerData, useSharedPassengerData } from '../home/passenger-data';
import { SubscriptionsScreen } from '../subscriptions/subscriptions-screen';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { useScreenBackground } from '../telegram/screen-background';
import { useForgetOnLeave } from './list-leave';
import type { MineTab } from './mine-tabs';
import { MY_REQUESTS, MyRequestsList } from './my-requests-list';
import { FindTripFlow } from './find-trip-flow';
import { NewRequestFlow } from './new-request-flow';
import { PlacesGate, usePlaces } from './places-gate';
import { useLinkOpen } from './use-link-open';
import './market.css';

// "Mening safarlarim" of a passenger: the booked seats, then the requests with drivers' offers.
type ScreenProps = { readonly onBack: () => void; readonly link?: AppLink };

export function MyRequestsScreen({ onBack, link }: ScreenProps) {
  useForgetOnLeave(MY_REQUESTS);
  const screen = (
    <PlacesGate onBack={onBack}>
      <MyRequests onBack={onBack} {...(link ? { link } : {})} />
    </PlacesGate>
  );
  // The same lists as the main screen, not a second load (G77); a bot link opens it with its own.
  return useSharedPassengerData() ? screen : <PassengerData>{screen}</PassengerData>;
}

// home: opened by the block of the main screen or a bot button, «Назад» goes straight home (G77).
type OpenedId = { readonly kind: Opened['kind']; readonly id: string; readonly home?: true };

// The latest copy of what is open; gone from the lists (a request that ended): nothing.
function fresh(open: OpenedId, booked: readonly Booking[], requests: readonly RideRequest[]): Opened | null {
  if (open.kind === 'booking') {
    const booking = booked.find((item) => item.id === open.id);
    return booking ? { kind: 'booking', booking } : null;
  }
  const request = requests.find((item) => item.id === open.id);
  return request ? { kind: 'request', request } : null;
}

function MyRequests({ onBack, link }: ScreenProps) {
  useScreenView('market.my_requests');
  // The gradient of docs/121 §5, as on the mockup g60/6.
  useScreenBackground();
  const lists = usePassengerData();
  const { value, failed, reload, refresh } = lists;
  const upToDate = useFreshLists(lists);
  // The screen keeps what is open by its id: a signal brings fresh data to it (docs/65 B2).
  const [openedId, setOpened] = useState<OpenedId | null>(null);
  const opened = value && openedId ? fresh(openedId, value[0], value[1]) : null;
  // A bot button or the block of the main screen: a booking opens itself, «Soʻrovim» its request
  // with all the offers and their answers right in the cards (docs/65 B5, G61 mockup 3-offers A).
  useLinkOpen(link, upToDate ? value : null, (open) => {
    if (open.name === BOOKING_LINK) setOpened({ kind: 'booking', id: open.id, home: true });
    if (open.name === REQUEST_LINK) setOpened({ kind: 'request', id: open.id, home: true });
  });
  const [subscriptionsOpen, setSubscriptionsOpen] = useState(false);
  // The tab stays while a booking is open: «Назад» comes to the same list.
  const [tab, setTab] = useState<MineTab>('live');
  // «Safar topish» of an empty «Faol» and «Qayta yuborish» of an old request (G75, mockup g75/2 A).
  const [finding, setFinding] = useState(false);
  const [again, setAgain] = useState<RideRequest | null>(null);
  const places = usePlaces();
  if (finding) return <FindTripFlow onBack={() => setFinding(false)} />;
  const route = again && { from: places.find(again.from), to: places.find(again.to) };
  // «Qayta yuborish»: the same route, the day is asked again; «Назад» from the points comes to the
  // day (G77, docs/170 О2).
  if (route?.from && route.to) {
    const close = () => (setAgain(null), reload());
    return <NewRequestFlow onBack={() => setAgain(null)} onClose={close} from={route.from} to={route.to} />;
  }
  if (subscriptionsOpen) return <SubscriptionsScreen onBack={() => setSubscriptionsOpen(false)} />;
  if (opened && value) {
    const close = (changed: boolean) => {
      if (openedId?.home) return onBack();
      setOpened(null);
      if (changed) reload();
    };
    return (
      <PassengerOpen
        opened={opened}
        offers={value[2]}
        onClose={close}
        onStale={() => void refresh()}
        onHome={onBack}
      />
    );
  }
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value || (link && !upToDate)) return <ScreenSkeleton onBack={onBack} />;
  return (
    <MyRequestsList
      lists={value}
      onBack={onBack}
      onRefresh={refresh}
      onBooking={(booking) => setOpened({ kind: 'booking', id: booking.id })}
      onRequest={(request) => setOpened({ kind: 'request', id: request.id })}
      onAgain={setAgain}
      onFind={() => setFinding(true)}
      onSubscriptions={() => setSubscriptionsOpen(true)}
      tab={tab}
      onTab={setTab}
    />
  );
}
