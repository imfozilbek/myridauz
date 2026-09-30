import { BOOKING_LINK, OFFER_LINK, type AppLink, type Booking, type RideRequest } from '@platform/contracts';
import { Button, Caption, Title } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { List } from '../components';
import { useScreenView } from '../context/analytics-context';
import { BookingCard } from '../bookings/booking-card';
import { FavoritesEntry } from '../comfort/comfort-entries';
import { FavoritesScreen } from '../comfort/favorites-screen';
import { PassengerOpen, type Opened } from '../bookings/passenger-open';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { EmptyState } from '../states/empty-state';
import { SubscriptionsEntry } from '../subscriptions/subscriptions-entry';
import { SubscriptionsScreen } from '../subscriptions/subscriptions-screen';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { BackButton } from '../telegram/back-button';
import { useScreenBackground } from '../telegram/screen-background';
import { PlacesGate } from './places-gate';
import { Paged } from './paged';
import { RequestCard } from './request-card';
import { useLinkOpen } from './use-link-open';
import { useLoad } from './use-list';
import './market.css';

// "Mening safarlarim" of a passenger: the booked seats, then the requests with drivers' offers.
type ScreenProps = { readonly onBack: () => void; readonly link?: AppLink };

export function MyRequestsScreen({ onBack, link }: ScreenProps) {
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
  const { t } = useI18n();
  const { market, bookings } = useApiClients();
  const { value, failed, reload } = useLoad(() =>
    Promise.all([bookings.myBookings(), market.myRequests(), bookings.myOffers()]),
  );
  // The screen keeps what is open by its id: a signal brings fresh data to it (docs/65 B2).
  const [openedId, setOpened] = useState<OpenedId | null>(null);
  const opened = value && openedId ? fresh(openedId, value[0], value[1]) : null;
  // A bot button: a booking opens itself, a new offer opens its request (docs/65 B5).
  useLinkOpen(link, value ?? null, (open, [, , offers]) => {
    if (open.name === BOOKING_LINK) setOpened({ kind: 'booking', id: open.id });
    const offer = offers.find((item) => open.name === OFFER_LINK && item.id === open.id);
    if (offer) setOpened({ kind: 'request', id: offer.requestId });
  });
  const [subscriptionsOpen, setSubscriptionsOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  if (subscriptionsOpen) return <SubscriptionsScreen onBack={() => setSubscriptionsOpen(false)} />;
  if (favoritesOpen) return <FavoritesScreen onBack={() => setFavoritesOpen(false)} />;
  if (opened && value) {
    const close = (changed: boolean) => {
      setOpened(null);
      if (changed) reload();
    };
    return <PassengerOpen opened={opened} offers={value[2]} onClose={close} onChanged={reload} />;
  }
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  const [booked, requests] = value;
  if (booked.length === 0 && requests.length === 0) {
    return (
      <>
        <BackButton onClick={onBack} />
        <EmptyState
          icon="myTrips"
          title={t('market.mine.requestsEmpty')}
          description={t('market.mine.requestsEmptyHint')}
          action={
            <Button size="m" mode="bezeled" onClick={() => setSubscriptionsOpen(true)}>
              {t('subscriptions.title')}
            </Button>
          }
        />
        <List>
          <FavoritesEntry onOpen={() => setFavoritesOpen(true)} />
        </List>
      </>
    );
  }
  return (
    <div className="market">
      <BackButton onClick={onBack} />
      <Title weight="1" className="market-title">
        {t('common.myTrips')}
      </Title>
      <List>
        {booked.length > 0 ? <Caption className="market-group">{t('bookings.mine')}</Caption> : null}
        <Paged
          items={booked}
          render={(booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              side="passenger"
              onOpen={() => setOpened({ kind: 'booking', id: booking.id })}
            />
          )}
        />
        {requests.length > 0 ? <Caption className="market-group">{t('market.mine.requests')}</Caption> : null}
        <Paged
          items={requests}
          render={(request) => (
            <RequestCard
              key={request.id}
              request={request}
              showStatus
              offers={
                value[2].filter((item) => item.requestId === request.id && item.status === 'sent').length
              }
              onOpen={() => setOpened({ kind: 'request', id: request.id })}
            />
          )}
        />
        <SubscriptionsEntry onOpen={() => setSubscriptionsOpen(true)} />
        <FavoritesEntry onOpen={() => setFavoritesOpen(true)} />
      </List>
    </div>
  );
}
