import { BOOKING_LINK, OFFER_LINK, type AppLink, type Booking, type RideRequest } from '@platform/contracts';
import { useState } from 'react';
import { useScreenView } from '../context/analytics-context';
import { FavoritesScreen } from '../comfort/favorites-screen';
import { PassengerOpen, type Opened } from '../bookings/passenger-open';
import { useApiClients } from '../context/api-clients';
import { SubscriptionsScreen } from '../subscriptions/subscriptions-screen';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { useScreenBackground } from '../telegram/screen-background';
import { useForgetOnLeave } from './list-leave';
import type { MineTab } from './mine-tabs';
import { MY_REQUESTS, MyRequestsList } from './my-requests-list';
import { PlacesGate } from './places-gate';
import { useLinkOpen } from './use-link-open';
import { useLoad } from './use-list';
import './market.css';

// "Mening safarlarim" of a passenger: the booked seats, then the requests with drivers' offers.
type ScreenProps = { readonly onBack: () => void; readonly link?: AppLink };

export function MyRequestsScreen({ onBack, link }: ScreenProps) {
  useForgetOnLeave(MY_REQUESTS);
  return (
    <PlacesGate onBack={onBack}>
      <MyRequests onBack={onBack} {...(link ? { link } : {})} />
    </PlacesGate>
  );
}

type OpenedId = { readonly kind: Opened['kind']; readonly id: string };

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
  const { market, bookings } = useApiClients();
  const { value, failed, reload, refresh } = useLoad(
    () => Promise.all([bookings.myBookings(), market.myRequests(), bookings.myOffers()]),
    MY_REQUESTS,
  );
  // The screen keeps what is open by its id: a signal brings fresh data to it (docs/65 B2).
  const [openedId, setOpened] = useState<OpenedId | null>(null);
  const opened = value && openedId ? fresh(openedId, value[0], value[1]) : null;
  // A bot button: a booking opens itself, a new offer opens its request with all the offers and
  // their answers right in the cards (docs/65 B5, G61 mockup 3-offers A).
  useLinkOpen(link, value ?? null, (open, [, , offers]) => {
    if (open.name === BOOKING_LINK) setOpened({ kind: 'booking', id: open.id });
    const offer = offers.find((item) => open.name === OFFER_LINK && item.id === open.id);
    if (offer) setOpened({ kind: 'request', id: offer.requestId });
  });
  const [subscriptionsOpen, setSubscriptionsOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  // The tab stays while a booking is open: «Назад» comes to the same list.
  const [tab, setTab] = useState<MineTab>('live');
  if (subscriptionsOpen) return <SubscriptionsScreen onBack={() => setSubscriptionsOpen(false)} />;
  if (favoritesOpen) return <FavoritesScreen onBack={() => setFavoritesOpen(false)} />;
  if (opened && value) {
    const close = (changed: boolean) => {
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
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  return (
    <MyRequestsList
      lists={value}
      onBack={onBack}
      onRefresh={refresh}
      onBooking={(booking) => setOpened({ kind: 'booking', id: booking.id })}
      onRequest={(request) => setOpened({ kind: 'request', id: request.id })}
      onSubscriptions={() => setSubscriptionsOpen(true)}
      onFavorites={() => setFavoritesOpen(true)}
      tab={tab}
      onTab={setTab}
    />
  );
}
