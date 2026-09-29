import type { Trip } from '@platform/contracts';
import { Title } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { List } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { EmptyState } from '../states/empty-state';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { BackButton } from '../telegram/back-button';
import { useScreenBackground } from '../telegram/screen-background';
import { PlacesGate } from './places-gate';
import { TripCard } from './trip-card';
import { TripScreen } from './trip-screen';
import { useList } from './use-list';
import './market.css';

// The admin Mini App: trips go out without approval, the team only looks at them (owner decision 29.09.2026).
export function TeamTripsScreen({ onBack }: { readonly onBack: () => void }) {
  return (
    <PlacesGate>
      <TeamTrips onBack={onBack} />
    </PlacesGate>
  );
}

function TeamTrips({ onBack }: { readonly onBack: () => void }) {
  useScreenView('team.trips');
  useScreenBackground('grouped');
  const { t } = useI18n();
  const { market } = useApiClients();
  const { items, failed, reload } = useList(() => market.teamTrips());
  const [open, setOpen] = useState<Trip | null>(null);
  if (open) return <TripScreen trip={open} readOnly onBack={() => setOpen(null)} />;
  if (failed) return <ErrorScreen onRetry={reload} />;
  if (!items) return <ScreenSkeleton />;
  return (
    <div className="market">
      <BackButton onClick={onBack} />
      <Title weight="1" className="market-title">
        {t('common.admin.trips')}
      </Title>
      {items.length === 0 ? (
        <EmptyState
          icon="trip"
          title={t('common.admin.tripsEmpty')}
          description={t('common.admin.tripsHint')}
        />
      ) : (
        <List>
          {items.map((trip) => (
            <TripCard key={trip.id} trip={trip} showStatus onOpen={() => setOpen(trip)} />
          ))}
        </List>
      )}
    </div>
  );
}
