import { Button, Caption, Title } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { List } from '../components';
import { useScreenView } from '../context/analytics-context';
import { BookingCard } from '../bookings/booking-card';
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
import { RequestCard } from './request-card';
import { useLoad } from './use-list';
import './market.css';

// "Mening safarlarim" of a passenger: the booked seats, then the requests with drivers' offers.
export function MyRequestsScreen({ onBack }: { readonly onBack: () => void }) {
  return (
    <PlacesGate>
      <MyRequests onBack={onBack} />
    </PlacesGate>
  );
}

function MyRequests({ onBack }: { readonly onBack: () => void }) {
  useScreenView('market.my_requests');
  useScreenBackground('grouped');
  const { t } = useI18n();
  const { market, bookings } = useApiClients();
  const { value, failed, reload } = useLoad(() =>
    Promise.all([bookings.myBookings(), market.myRequests(), bookings.myOffers()]),
  );
  const [opened, setOpened] = useState<Opened | null>(null);
  const [subscriptionsOpen, setSubscriptionsOpen] = useState(false);
  if (subscriptionsOpen) return <SubscriptionsScreen onBack={() => setSubscriptionsOpen(false)} />;
  if (opened && value) {
    const close = (changed: boolean) => {
      setOpened(null);
      if (changed) reload();
    };
    return <PassengerOpen opened={opened} offers={value[2]} onClose={close} />;
  }
  if (failed) return <ErrorScreen onRetry={reload} />;
  if (!value) return <ScreenSkeleton />;
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
        {booked.map((booking) => (
          <BookingCard
            key={booking.id}
            booking={booking}
            side="passenger"
            onOpen={() => setOpened({ kind: 'booking', booking })}
          />
        ))}
        {requests.length > 0 ? <Caption className="market-group">{t('market.mine.requests')}</Caption> : null}
        {requests.map((request) => (
          <RequestCard
            key={request.id}
            request={request}
            showStatus
            onOpen={() => setOpened({ kind: 'request', request })}
          />
        ))}
        <SubscriptionsEntry onOpen={() => setSubscriptionsOpen(true)} />
      </List>
    </div>
  );
}
