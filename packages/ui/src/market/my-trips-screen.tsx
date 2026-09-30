import type { Trip } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { Button, Title } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { List } from '../components';
import { useScreenView } from '../context/analytics-context';
import { DriverBooking } from '../bookings/driver-booking';
import { ChatScreen } from '../chat/chat-screen';
import { DriverShare } from '../comfort/driver-share';
import { SentOffers } from '../bookings/sent-offers';
import { TripBookings } from '../bookings/trip-bookings';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { EmptyState } from '../states/empty-state';
import { SubscriptionsEntry } from '../subscriptions/subscriptions-entry';
import { SubscriptionsScreen } from '../subscriptions/subscriptions-screen';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { BackButton } from '../telegram/back-button';
import { confirm, haptic } from '../telegram/feedback';
import { ActionFailure } from '../states/action-failure';
import { errorKey } from './error-text';
import { useScreenBackground } from '../telegram/screen-background';
import { PlacesGate } from './places-gate';
import { TripCard } from './trip-card';
import { TripScreen } from './trip-screen';
import { useLoad } from './use-list';
import './market.css';

// "Mening safarlarim" of a driver: the sent offers, every trip with its bookings (docs/35).
export function MyTripsScreen({ onBack }: { readonly onBack: () => void }) {
  return (
    <PlacesGate onBack={onBack}>
      <MyTrips onBack={onBack} />
    </PlacesGate>
  );
}

// What is open, by its ids: a signal brings fresh data to it (docs/65 B2).
type Opened = { readonly tripId: string; readonly bookingId?: string };

function MyTrips({ onBack }: { readonly onBack: () => void }) {
  useScreenView('market.my_trips');
  useScreenBackground('grouped');
  const { t } = useI18n();
  const { market, bookings } = useApiClients();
  const { value, failed, reload } = useLoad(() =>
    Promise.all([market.myTrips(), bookings.driverBookings(), bookings.driverOffers()]),
  );
  const [opened, setOpened] = useState<Opened | null>(null);
  const [failure, setFailure] = useState<TranslationKey | null>(null);
  const trip = opened && value ? value[0].find((item) => item.id === opened.tripId) : undefined;
  const booking = opened?.bookingId ? value?.[1].find((item) => item.id === opened.bookingId) : undefined;
  const [chatKey, setChatKey] = useState<string | null>(null);
  const [subscriptionsOpen, setSubscriptionsOpen] = useState(false);
  if (subscriptionsOpen) return <SubscriptionsScreen onBack={() => setSubscriptionsOpen(false)} />;
  // A cancel is asked first; a failed one keeps the trip open with the reason (docs/65 B3, B4).
  const cancel = async (open: Trip) => {
    if (!(await confirm(t('market.trip.cancelAsk'), t('market.trip.cancel')))) return;
    try {
      setFailure(null);
      await market.cancelTrip(open.id);
      haptic.success();
      setOpened(null);
      reload();
    } catch (caught) {
      haptic.error();
      setFailure(errorKey(caught));
    }
  };
  if (chatKey) return <ChatScreen chatKey={chatKey} onBack={() => setChatKey(null)} />;
  if (trip && booking) {
    const close = (changed: boolean) => {
      setOpened({ tripId: trip.id });
      if (changed) reload();
    };
    return <DriverBooking booking={booking} onClose={close} />;
  }
  if (trip && value) {
    const back = () => (setOpened(null), setFailure(null));
    return (
      <TripScreen trip={trip} onBack={back} onCancel={() => void cancel(trip)}>
        <ActionFailure error={failure} />
        <DriverShare trip={trip} />
        <TripBookings
          bookings={value[1].filter((item) => item.trip.id === trip.id)}
          onOpen={(item) => setOpened({ tripId: trip.id, bookingId: item.id })}
        />
      </TripScreen>
    );
  }
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  const [trips, , offers] = value;
  if (trips.length === 0 && offers.length === 0) {
    return (
      <>
        <BackButton onClick={onBack} />
        <EmptyState
          icon="myTrips"
          title={t('market.mine.empty')}
          description={t('market.mine.emptyHint')}
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
        <SentOffers offers={offers} onOpen={(offer) => setChatKey(offer.chatKey)} />
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} showStatus onOpen={() => setOpened({ tripId: trip.id })} />
        ))}
        <SubscriptionsEntry onOpen={() => setSubscriptionsOpen(true)} />
      </List>
    </div>
  );
}
