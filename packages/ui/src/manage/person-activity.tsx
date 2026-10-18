import type { PersonActivity, PersonId } from '@platform/contracts';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { PlacesGate, usePlaceLabel } from '../market/places-gate';
import { useLoad } from '../market/use-list';
import { ManageGroup, ManageRow } from './manage-page';

// What a person did lately, under the card of «Odamlar» (G45, docs/111): the seats cancelled after a
// «yes», the newest trips, seats and complaints against them. It loads apart: the card opens at once.
export function PersonActivityGroups({ id }: { readonly id: PersonId }) {
  const { team } = useApiClients();
  const { value } = useLoad(() => team.activity(id));
  if (!value) return null;
  return (
    <PlacesGate>
      <ActivityGroups activity={value} />
    </PlacesGate>
  );
}

function ActivityGroups({ activity }: { readonly activity: PersonActivity }) {
  const { t, formatDate } = useI18n();
  const place = usePlaceLabel();
  const route = (from: string, to: string) =>
    t('common.route', { from: place(from).name, to: place(to).name });
  const meta = (at: number, more: string) => t('home.meta', { when: formatDate(new Date(at)), more });
  const { trips, rides, complaints, cancels } = activity;
  return (
    <>
      <ManageGroup title={t('manage.person.cancels')}>
        <ManageRow
          icon="close"
          title={t('manage.person.cancelsHint')}
          value={t('manage.person.tripsValue', { trips: cancels.asDriver, rides: cancels.asPassenger })}
        />
      </ManageGroup>
      {trips.length > 0 ? (
        <ManageGroup title={t('manage.person.lastTrips')}>
          {trips.map((trip) => (
            <ManageRow
              key={trip.id}
              icon="trip"
              title={route(trip.from, trip.to)}
              hint={meta(trip.departAt, t(`market.status.${trip.status}`))}
            />
          ))}
        </ManageGroup>
      ) : null}
      {rides.length > 0 ? (
        <ManageGroup title={t('manage.person.lastRides')}>
          {rides.map((ride) => (
            <ManageRow
              key={ride.id}
              icon="seats"
              title={route(ride.from, ride.to)}
              hint={meta(ride.departAt, t(`bookings.status.${ride.status}`))}
            />
          ))}
        </ManageGroup>
      ) : null}
      {complaints.length > 0 ? (
        <ManageGroup title={t('manage.person.lastComplaints')}>
          {complaints.map((complaint) => (
            <ManageRow
              key={complaint.id}
              icon="complaints"
              title={complaint.reasons.map((reason) => t(`complaints.reason.${reason}`)).join(', ')}
              hint={meta(complaint.at, t(`manage.complaintStatus.${complaint.status}`))}
            />
          ))}
        </ManageGroup>
      ) : null}
    </>
  );
}
