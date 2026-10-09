import { LINK_ID, TRIP_LINK, type Trip } from '@platform/contracts';
import { Section, Title } from '@telegram-apps/telegram-ui';
import { Fragment, useState } from 'react';
import { TeamTripBookings } from '../bookings/trip-bookings';
import { Button, List } from '../components';
import { useApiClients } from '../context/api-clients';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { EmptyState } from '../states/empty-state';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { Screen } from '../screen/screen';
import { launchParam, useLinkOpened } from '../telegram/launch-param';
import { useScreenBackground } from '../telegram/screen-background';
import { PlacesGate } from './places-gate';
import { TripCard } from './trip-card';
import { TripScreen } from './trip-screen';
import { useTeamDays } from './team-days';
import { useLoad } from './use-list';
import { useDayLabel } from './when';
import './market.css';

const LINK = [TRIP_LINK];

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
  useScreenBackground();
  const { t } = useI18n();
  const dayLabel = useDayLabel();
  const { now, days, failed, reload, refresh, more } = useTeamDays();
  const [open, setOpen] = useState<Trip | null>(null);
  // «Bronni ochish» under a support question: ?open=trips&trip=<id> (G68, mockup g68/4).
  const [linked, setLinked] = useState(() => launchParam(TRIP_LINK, LINK_ID));
  useLinkOpened(linked !== null, LINK);
  if (linked) return <LinkedTrip id={linked} onBack={() => setLinked(null)} />;
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
      <Screen onBack={onBack} onRefresh={refresh} />
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

// One trip by its id with its bookings; back goes to the trips of the days.
function LinkedTrip({ id, onBack }: { readonly id: string; readonly onBack: () => void }) {
  const { market } = useApiClients();
  const { value, failed, reload } = useLoad(() => market.trip(id));
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  return (
    <TripScreen trip={value} readOnly onBack={onBack}>
      <TeamTripBookings tripId={value.id} />
    </TripScreen>
  );
}
