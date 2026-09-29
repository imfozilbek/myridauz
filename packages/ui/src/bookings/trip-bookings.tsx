import type { Booking } from '@platform/contracts';
import { CellValue } from '../account/cell-value';
import { ProfilePhoto } from '../account/profile/profile-photo';
import { Cell, Section } from '../components';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { useLoad } from '../market/use-list';

const PHOTO_SIZE = 40;
type Props = { readonly bookings: readonly Booking[]; readonly onOpen?: (booking: Booking) => void };

// The bookings of one trip for its driver or the team: who, how many seats, the status.
export function TripBookings({ bookings, onOpen }: Props) {
  const { t } = useI18n();
  return (
    <Section
      header={t('bookings.passengers')}
      footer={bookings.length === 0 ? t('bookings.none') : undefined}
    >
      {bookings.map((booking) => (
        <Cell
          key={booking.id}
          onClick={onOpen ? () => onOpen(booking) : undefined}
          before={
            <ProfilePhoto
              userId={booking.passenger.id}
              name={booking.passenger.firstName}
              hasAvatar={booking.passenger.hasAvatar}
              size={PHOTO_SIZE}
            />
          }
          subtitle={t(`bookings.status.${booking.status}`)}
          after={<CellValue>{t('market.request.seats', { count: String(booking.seats) })}</CellValue>}
        >
          {booking.passenger.firstName}
        </Cell>
      ))}
    </Section>
  );
}

// The team looks at the bookings of any trip (G08): read only.
export function TeamTripBookings({ tripId }: { readonly tripId: string }) {
  const { bookings } = useApiClients();
  const { value } = useLoad(() => bookings.tripBookings(tripId));
  return value ? <TripBookings bookings={value} /> : null;
}
