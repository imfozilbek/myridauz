import { LINK_ID, TRIP_LINK, type PersonId, type Trip } from '@platform/contracts';
import { useState } from 'react';
import { TeamTripBookings } from '../bookings/trip-bookings';
import { useApiClients } from '../context/api-clients';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { ManageGroup, ManagePage, ManageRow } from '../manage/manage-page';
import { PeopleScreen } from '../manage/people-screen';
import { EmptyState } from '../states/empty-state';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { launchParam, useLinkOpened } from '../telegram/launch-param';
import { PlacesGate } from './places-gate';
import { TeamCancelTrip } from './team-cancel-trip';
import { TeamTripRow } from './team-trip-row';
import { TripScreen } from './trip-screen';
import { useTeamDays } from './team-days';
import { useLoad } from './use-list';
import { useDayLabel } from './when';

const LINK = [TRIP_LINK];

// The admin Mini App: trips go out without approval, the team looks at them (owner decision 29.09.2026)
// and cancels one with a reason (Q5 of docs/111, G45).
// Day by day from yesterday on, each day a card of rows (docs/90 F-A6, G78 sheet 4).
export function TeamTripsScreen({ onBack }: { readonly onBack: () => void }) {
  return (
    <PlacesGate onBack={onBack}>
      <TeamTrips onBack={onBack} />
    </PlacesGate>
  );
}

function TeamTrips({ onBack }: { readonly onBack: () => void }) {
  useScreenView('team.trips');
  const { t } = useI18n();
  const dayLabel = useDayLabel();
  const { now, days, failed, reload, refresh, more } = useTeamDays();
  const [open, setOpen] = useState<Trip | null>(null);
  // The card of the driver or of a passenger; back returns to the same trip (G78 sheet 4).
  const [person, onPerson] = useState<PersonId | null>(null);
  // «Bronni ochish» under a support question: ?open=trips&trip=<id> (G68, mockup g68/4).
  const [linked, setLinked] = useState(() => launchParam(TRIP_LINK, LINK_ID));
  useLinkOpened(linked !== null, LINK);
  if (person) return <PeopleScreen person={person} onBack={() => onPerson(null)} />;
  if (linked) return <LinkedTrip id={linked} onBack={() => setLinked(null)} onPerson={onPerson} />;
  if (open) {
    return (
      <TripScreen trip={open} onBack={() => setOpen(null)} onPerson={onPerson}>
        <TeamTripBookings tripId={open.id} onPerson={onPerson} />
        <TeamCancelTrip trip={open} onCancelled={() => (setOpen(null), refresh())} />
      </TripScreen>
    );
  }
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!days) return <ScreenSkeleton onBack={onBack} />;
  const busy = days.filter((day) => day.trips.length > 0);
  return (
    <ManagePage
      title={t('common.admin.trips')}
      hint={t('common.admin.tripsHint')}
      onBack={onBack}
      onRefresh={refresh}
    >
      {busy.length === 0 ? <EmptyState icon="trip" title={t('common.admin.tripsEmpty')} /> : null}
      {busy.map((day) => (
        <ManageGroup key={day.date} title={dayLabel(day.date, now)}>
          {day.trips.map((trip) => (
            <TeamTripRow key={trip.id} trip={trip} onOpen={() => setOpen(trip)} />
          ))}
        </ManageGroup>
      ))}
      {more ? (
        <ManageGroup>
          <ManageRow icon="down" title={t('market.mine.more')} onClick={more} />
        </ManageGroup>
      ) : null}
    </ManagePage>
  );
}

type LinkedProps = {
  readonly id: string;
  readonly onBack: () => void;
  readonly onPerson: (id: PersonId) => void;
};

// One trip by its id with its bookings; back goes to the trips of the days.
function LinkedTrip({ id, onBack, onPerson }: LinkedProps) {
  const { market } = useApiClients();
  const { value, failed, reload } = useLoad(() => market.trip(id));
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  return (
    <TripScreen trip={value} onBack={onBack} onPerson={onPerson}>
      <TeamTripBookings tripId={value.id} onPerson={onPerson} />
      <TeamCancelTrip trip={value} onCancelled={reload} />
    </TripScreen>
  );
}
