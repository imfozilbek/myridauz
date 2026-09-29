import type { Booking, Trip } from '@platform/contracts';
import { Title } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { List } from '../components';
import { useScreenView } from '../context/analytics-context';
import { DriverBooking } from '../bookings/driver-booking';
import { SentOffers } from '../bookings/sent-offers';
import { TripBookings } from '../bookings/trip-bookings';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { EmptyState } from '../states/empty-state';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { BackButton } from '../telegram/back-button';
import { haptic } from '../telegram/feedback';
import { useScreenBackground } from '../telegram/screen-background';
import { PlacesGate } from './places-gate';
import { TripCard } from './trip-card';
import { TripScreen } from './trip-screen';
import { useLoad } from './use-list';
import './market.css';

// "Mening safarlarim" of a driver: the sent offers, every trip with its bookings (docs/35).
export function MyTripsScreen({ onBack }: { readonly onBack: () => void }) {
  return (
    <PlacesGate>
      <MyTrips onBack={onBack} />
    </PlacesGate>
  );
}

type Opened = { readonly trip: Trip; readonly booking?: Booking };

function MyTrips({ onBack }: { readonly onBack: () => void }) {
  useScreenView('market.my_trips');
  useScreenBackground('grouped');
  const { t } = useI18n();
  const { market, bookings } = useApiClients();
  const { value, failed, reload } = useLoad(() =>
    Promise.all([market.myTrips(), bookings.driverBookings(), bookings.driverOffers()]),
  );
  const [opened, setOpened] = useState<Opened | null>(null);
  const cancel = async (trip: Trip) => {
    try {
      await market.cancelTrip(trip.id);
      haptic.success();
    } catch {
      haptic.error();
    }
    setOpened(null);
    reload();
  };
  if (opened?.booking) {
    const { trip, booking } = opened;
    const close = (changed: boolean) => {
      setOpened(changed ? null : { trip });
      if (changed) reload();
    };
    return <DriverBooking booking={booking} onClose={close} />;
  }
  if (opened && value) {
    const { trip } = opened;
    return (
      <TripScreen trip={trip} onBack={() => setOpened(null)} onCancel={() => void cancel(trip)}>
        <TripBookings
          bookings={value[1].filter((booking) => booking.trip.id === trip.id)}
          onOpen={(booking) => setOpened({ trip, booking })}
        />
      </TripScreen>
    );
  }
  if (failed) return <ErrorScreen onRetry={reload} />;
  if (!value) return <ScreenSkeleton />;
  const [trips, , offers] = value;
  if (trips.length === 0 && offers.length === 0) {
    return (
      <>
        <BackButton onClick={onBack} />
        <EmptyState icon="myTrips" title={t('market.mine.empty')} description={t('market.mine.emptyHint')} />
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
        <SentOffers offers={offers} />
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} showStatus onOpen={() => setOpened({ trip })} />
        ))}
      </List>
    </div>
  );
}
