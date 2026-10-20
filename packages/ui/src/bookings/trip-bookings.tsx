import { FAR_EXTRA_KM, type Booking, type PersonId } from '@platform/contracts';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { ManageGroup, ManageRow } from '../manage/manage-page';
import { useLoad } from '../market/use-list';
import { requestsInOrder, takenFirst } from './trip-bookings-order';

type Props = {
  readonly bookings: readonly Booking[];
  readonly onPerson: ((id: PersonId) => void) | undefined;
};

// The bookings of one trip for the team: who, the status, how many seats; a tap opens the card of
// the person (G78 sheet 4). The requests come first, by the extra way to the passengers already
// taken (G24, docs/70).
export function TripBookings({ bookings, onPerson }: Props) {
  const { t } = useI18n();
  const requested = requestsInOrder(bookings.filter((booking) => booking.status === 'requested'));
  const fits = requested.filter((booking) => (booking.extraKm ?? 0) <= FAR_EXTRA_KM);
  const others = requested.filter((booking) => (booking.extraKm ?? 0) > FAR_EXTRA_KM);
  const rest = takenFirst(bookings.filter((booking) => booking.status !== 'requested'));
  const row = (booking: Booking) => {
    const status = t(`bookings.status.${booking.status}`);
    const seats = t('market.request.seats', { count: String(booking.seats) });
    const extra = booking.extraKm ? t('way.driver.extra', { km: String(booking.extraKm) }) : null;
    return (
      <ManageRow
        key={booking.id}
        icon="profile"
        title={booking.passenger.firstName}
        hint={t('home.meta', {
          when: status,
          more: extra ? t('home.meta', { when: seats, more: extra }) : seats,
        })}
        onClick={onPerson ? () => onPerson(booking.passenger.id) : undefined}
      />
    );
  };
  return (
    <>
      {fits.length > 0 ? <ManageGroup title={t('way.driver.fits')}>{fits.map(row)}</ManageGroup> : null}
      {others.length > 0 ? <ManageGroup title={t('way.driver.others')}>{others.map(row)}</ManageGroup> : null}
      {rest.length > 0 || requested.length === 0 ? (
        <ManageGroup title={t('bookings.passengers')}>
          {bookings.length === 0 ? <ManageRow icon="passengers" title={t('bookings.none')} /> : null}
          {rest.map(row)}
        </ManageGroup>
      ) : null}
    </>
  );
}

// The team looks at the bookings of any trip (G08): read only.
export function TeamTripBookings({
  tripId,
  onPerson,
}: {
  readonly tripId: string;
  readonly onPerson: Props['onPerson'];
}) {
  const { bookings } = useApiClients();
  const { value } = useLoad(() => bookings.tripBookings(tripId));
  return value ? <TripBookings bookings={value} onPerson={onPerson} /> : null;
}
