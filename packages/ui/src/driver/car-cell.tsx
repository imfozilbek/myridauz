import { formatPlate } from '@platform/contracts';
import { CellValue } from '../account/cell-value';
import { Cell, Section } from '../components';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { useDriver } from './driver-context';

// In the profile of an approved driver: the car, a tap changes it (a new check follows, docs/04).
export function CarCell() {
  const driver = useDriver();
  const { t } = useI18n();
  const car = driver?.application.car;
  if (!driver || !car) return null;
  return (
    <Section>
      <Cell
        before={<IconTile name="car" />}
        subtitle={`${car.make} ${car.model}`}
        after={<CellValue>{formatPlate(car.plate)}</CellValue>}
        onClick={driver.editCar}
      >
        {t('drivers.car')}
      </Cell>
    </Section>
  );
}
