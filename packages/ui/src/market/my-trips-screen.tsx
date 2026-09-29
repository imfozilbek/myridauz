import type { Trip } from '@platform/contracts';
import { Title } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
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
import { useList } from './use-list';
import './market.css';

// "Mening safarlarim" of a driver: every trip with its status; an active one can be cancelled (docs/35).
export function MyTripsScreen({ onBack }: { readonly onBack: () => void }) {
  return (
    <PlacesGate>
      <MyTrips onBack={onBack} />
    </PlacesGate>
  );
}

function MyTrips({ onBack }: { readonly onBack: () => void }) {
  useScreenView('market.my_trips');
  useScreenBackground('grouped');
  const { t } = useI18n();
  const { market } = useApiClients();
  const { items, failed, reload } = useList(() => market.myTrips());
  const [open, setOpen] = useState<Trip | null>(null);
  const cancel = async (trip: Trip) => {
    try {
      await market.cancelTrip(trip.id);
      haptic.success();
    } catch {
      haptic.error();
    }
    setOpen(null);
    reload();
  };
  if (open) return <TripScreen trip={open} onBack={() => setOpen(null)} onCancel={() => void cancel(open)} />;
  if (failed) return <ErrorScreen onRetry={reload} />;
  if (!items) return <ScreenSkeleton />;
  if (items.length === 0) {
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
        <Section>
          {items.map((trip) => (
            <TripCard key={trip.id} trip={trip} showStatus onOpen={() => setOpen(trip)} />
          ))}
        </Section>
      </List>
    </div>
  );
}
