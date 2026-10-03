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
  useScreenBackground('grouped');
  const { market, bookings } = useApiClients();
  const { value, failed, reload, refresh } = useLoad(
    () => Promise.all([bookings.myBookings(), market.myRequests(), bookings.myOffers()]),
    MY_REQUESTS,
  );
  // The screen keeps what is open by its id: a signal brings fresh data to it (docs/65 B2).
  const [openedId, setOpened] = useState<OpenedId | null>(null);
  const opened = value && openedId ? fresh(openedId, value[0], value[1]) : null;
  // A bot button: a booking opens itself, a new offer opens itself over its request (docs/65 B5);
  // «Назад» from the offer shows the request with all its offers (G40, docs/106 K6).
  const [linkedOffer, setLinkedOffer] = useState<string | null>(null);
  useLinkOpen(link, value ?? null, (open, [, , offers]) => {
    if (open.name === BOOKING_LINK) setOpened({ kind: 'booking', id: open.id });
    const offer = offers.find((item) => open.name === OFFER_LINK && item.id === open.id);
    if (!offer) return;
    setOpened({ kind: 'request', id: offer.requestId });
    setLinkedOffer(offer.id);
  });
  const [subscriptionsOpen, setSubscriptionsOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  if (subscriptionsOpen) return <SubscriptionsScreen onBack={() => setSubscriptionsOpen(false)} />;
  if (favoritesOpen) return <FavoritesScreen onBack={() => setFavoritesOpen(false)} />;
  if (opened && value) {
    const close = (changed: boolean) => {
      setOpened(null);
      setLinkedOffer(null);
      if (changed) reload();
    };
    return (
      <PassengerOpen
        opened={opened}
        offers={value[2]}
        {...(linkedOffer ? { offerId: linkedOffer } : {})}
        onClose={close}
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
    />
  );
}
