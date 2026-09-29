import type { Trip } from '@platform/contracts';
import { CellValue } from '../account/cell-value';
import { ProfilePhoto } from '../account/profile/profile-photo';
import { Cell } from '../components';
import { useI18n } from '../context/i18n-context';
import { usePlaceName } from './places-gate';
import { useWhenLabel } from './when';

const PHOTO_SIZE = 44;

type TripCardProps = { readonly trip: Trip; readonly showStatus?: boolean; readonly onOpen: () => void };

// One trip in a list: where, when, how many seats, the price, the driver and the car (docs/09).
export function TripCard({ trip, showStatus = false, onOpen }: TripCardProps) {
  const { t, formatMoney } = useI18n();
  const place = usePlaceName();
  const when = useWhenLabel();
  const { driver } = trip;
  const car = `${driver.car.make} ${driver.car.model}, ${t(`drivers.color.${driver.car.color}`)}`;
  const details = [
    `${driver.firstName} · ${car}`,
    ...(trip.woman ? [t('market.search.woman')] : []),
    ...(showStatus ? [t(`market.status.${trip.status}`)] : []),
  ];
  return (
    <Cell
      multiline
      before={
        <ProfilePhoto
          userId={driver.id}
          name={driver.firstName}
          hasAvatar={driver.hasAvatar}
          size={PHOTO_SIZE}
        />
      }
      subtitle={`${when(trip.departAt)} · ${t('market.trip.seats', { count: String(trip.seats) })}`}
      description={details.join(' · ')}
      after={<CellValue>{formatMoney(trip.price)}</CellValue>}
      onClick={onOpen}
    >
      {`${place(trip.from)} → ${place(trip.to)}`}
    </Cell>
  );
}
