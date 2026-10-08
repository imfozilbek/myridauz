import { Cell, Section } from '../components';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { useDriver } from './driver-context';
import { UzPlate } from '../plate/uz-plate';

// In the profile of an approved driver: the car, a tap changes it (a new check follows, docs/04).
export function CarCell() {
  const driver = useDriver();
  const { t } = useI18n();
  const car = driver?.application.car;
  if (!driver || !car || driver.application.status !== 'approved') return null;
  return (
    <Section>
      <Cell
        before={<IconTile name="car" />}
        subtitle={`${car.make} ${car.model}`}
        after={<UzPlate plate={car.plate} size="s" />}
        onClick={driver.editCar}
      >
        {t('drivers.car')}
      </Cell>
    </Section>
  );
}

// In the profile of an approved driver: "Hamyon", not a 4th main action (G08).
export function WalletCell({ onOpen }: { readonly onOpen: () => void }) {
  const driver = useDriver();
  const { t } = useI18n();
  if (driver?.application.status !== 'approved') return null;
  return (
    <Section>
      <Cell before={<IconTile name="wallet" />} subtitle={t('wallet.hint')} onClick={onOpen}>
        {t('wallet.title')}
      </Cell>
    </Section>
  );
}
