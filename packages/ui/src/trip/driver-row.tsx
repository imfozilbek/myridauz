import type { Car } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { PersonBadge } from '../find/person-badge';
import { PlateBadge } from '../find/plate-badge';
import './driver-row.css';

// The face: 46 px on a booking, 44 px for the close people (mockups g60/1, g60/3).
const PHOTO = 46;

type Props = {
  readonly driver: { readonly id: string; readonly firstName: string; readonly hasAvatar: boolean };
  readonly car: Pick<Car, 'make' | 'model' | 'color'>;
  // «★ 4,9» on a booking, «· haydovchi» for the close people (mockups g60/1, g60/3).
  readonly note: string | null;
  // Only while the booking is open (docs/07, docs/129).
  readonly plate: string | null;
  readonly photo?: number;
};

// The driver of a trip: the face, the name, the car and its plate (docs/118 path 3).
export function DriverRow({ driver, car, note, plate, photo = PHOTO }: Props) {
  const { t } = useI18n();
  return (
    <div className={plate ? 'driver-row' : 'driver-row driver-row-bare'}>
      <PersonBadge id={driver.id} name={driver.firstName} hasAvatar={driver.hasAvatar} size={photo} plain />
      <span className="driver-row-text">
        <span className="driver-row-name">
          {driver.firstName}
          {note ? <span className="driver-row-note">{note}</span> : null}
        </span>
        <span className="driver-row-car">
          {t('find.car', { make: car.make, model: car.model, color: t(`drivers.color.${car.color}`) })}
        </span>
        {plate ? <PlateBadge plate={plate} /> : null}
      </span>
    </div>
  );
}
