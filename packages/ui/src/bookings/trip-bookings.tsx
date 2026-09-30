import { FAR_EXTRA_KM, type Booking } from '@platform/contracts';
import { CellValue } from '../account/cell-value';
import { ProfilePhoto } from '../account/profile/profile-photo';
import { Cell, Section } from '../components';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { useLoad } from '../market/use-list';

const PHOTO_SIZE = 40;
type Props = {
  readonly bookings: readonly Booking[];
  readonly onOpen?: (booking: Booking) => void;
  // «Safar xaritasi» of the driver, once a passenger is confirmed (G24).
  readonly onMap?: () => void;
};

// The bookings of one trip for its driver or the team: who, how many seats, the status. The
// requests come first, by the extra way to the passengers already taken (G24, docs/70).
export function TripBookings({ bookings, onOpen, onMap }: Props) {
  const { t } = useI18n();
  const requested = bookings.filter((booking) => booking.status === 'requested');
  const fits = requested.filter((booking) => (booking.extraKm ?? 0) <= FAR_EXTRA_KM);
  const others = requested.filter((booking) => (booking.extraKm ?? 0) > FAR_EXTRA_KM);
  const rest = bookings.filter((booking) => booking.status !== 'requested');
  const row = (booking: Booking) => {
    const status = t(`bookings.status.${booking.status}`);
    const extra = booking.extraKm ? t('way.driver.extra', { km: String(booking.extraKm) }) : null;
    return (
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
        subtitle={extra ? `${status} · ${extra}` : status}
        after={<CellValue>{t('market.request.seats', { count: String(booking.seats) })}</CellValue>}
      >
        {booking.passenger.firstName}
      </Cell>
    );
  };
  const hasConfirmed = bookings.some((booking) => booking.status === 'confirmed');
  return (
    <>
      {onMap && hasConfirmed ? (
        <Section>
          <Cell before={<IconTile name="navigate" tone="accent" />} onClick={onMap}>
            {t('way.map.title')}
          </Cell>
        </Section>
      ) : null}
      {fits.length > 0 ? <Section header={t('way.driver.fits')}>{fits.map(row)}</Section> : null}
      {others.length > 0 ? <Section header={t('way.driver.others')}>{others.map(row)}</Section> : null}
      {rest.length > 0 || requested.length === 0 ? (
        <Section
          header={t('bookings.passengers')}
          footer={bookings.length === 0 ? t('bookings.none') : undefined}
        >
          {rest.map(row)}
        </Section>
      ) : null}
    </>
  );
}

// The team looks at the bookings of any trip (G08): read only.
export function TeamTripBookings({ tripId }: { readonly tripId: string }) {
  const { bookings } = useApiClients();
  const { value } = useLoad(() => bookings.tripBookings(tripId));
  return value ? <TripBookings bookings={value} /> : null;
}
