import type { Trip } from '@platform/contracts';
import { Section, Title } from '@telegram-apps/telegram-ui';
import { Fragment, useState } from 'react';
import { TeamTripBookings } from '../bookings/trip-bookings';
import { Button, List } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { EmptyState } from '../states/empty-state';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { BackButton } from '../telegram/back-button';
import { useScreenBackground } from '../telegram/screen-background';
import { PlacesGate } from './places-gate';
import { TripCard } from './trip-card';
import { TripScreen } from './trip-screen';
import { useTeamDays } from './team-days';
import { useDayLabel } from './when';
import './market.css';

// The admin Mini App: trips go out without approval, the team only looks at them (owner decision 29.09.2026).
// Day by day from yesterday on, each day under its name (docs/90 F-A6).
export function TeamTripsScreen({ onBack }: { readonly onBack: () => void }) {
  return (
    <PlacesGate onBack={onBack}>
      <TeamTrips onBack={onBack} />
    </PlacesGate>
  );
}

function TeamTrips({ onBack }: { readonly onBack: () => void }) {
  useScreenView('team.trips');
  useScreenBackground('grouped');
  const { t } = useI18n();
  const dayLabel = useDayLabel();
  const { now, days, failed, reload, more } = useTeamDays();
  const [open, setOpen] = useState<Trip | null>(null);
  if (open) {
    return (
      <TripScreen trip={open} readOnly onBack={() => setOpen(null)}>
        <TeamTripBookings tripId={open.id} />
      </TripScreen>
    );
  }
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!days) return <ScreenSkeleton onBack={onBack} />;
  const busy = days.filter((day) => day.trips.length > 0);
  return (
    <div className="market">
      <BackButton onClick={onBack} />
      <Title weight="1" className="market-title">
        {t('common.admin.trips')}
      </Title>
      {busy.length === 0 ? (
        <EmptyState
          icon="trip"
          title={t('common.admin.tripsEmpty')}
          description={t('common.admin.tripsHint')}
        />
      ) : (
        <List>
          {busy.map((day) => (
            <Fragment key={day.date}>
              <Section.Header>{dayLabel(day.date, now)}</Section.Header>
              {day.trips.map((trip) => (
                <TripCard key={trip.id} trip={trip} showStatus onOpen={() => setOpen(trip)} />
              ))}
            </Fragment>
          ))}
        </List>
      )}
      {more ? (
        <div className="step-note">
          <Button mode="plain" size="m" stretched onClick={more}>
            {t('market.mine.more')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
