import { CAR_PHOTO_KINDS } from '@platform/contracts';
import { Progress } from '@telegram-apps/telegram-ui';
import { useAccount } from '../account/account-context';
import { useChevron } from '../chevron';
import { Cell, Section } from '../components';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { carReady, useDraftCar } from './car-answers';
import type { Driver } from './driver-context';

// The application has 3 parts: the car, the photos, the sending (G34).
const PARTS = 3;
const FULL = 100;

// On the main screen of a driver who has not sent the application yet (G34): what is left,
// with a bar of the parts done; a tap opens the application where it stopped.
export function ApplicationCard({ driver }: { readonly driver: Driver }) {
  const { t } = useI18n();
  const chevron = useChevron();
  const car = carReady(useDraftCar());
  const { photos } = driver.application;
  const face = useAccount()?.profile.hasAvatar === true;
  const shots = face && CAR_PHOTO_KINDS.every((kind) => photos[kind]);
  const done = [car, shots].filter(Boolean).length;
  return (
    <Section>
      <Cell
        before={<IconTile name="applications" tone="accent" />}
        subtitle={t('drivers.application.hint')}
        description={<Progress value={Math.round((done / PARTS) * FULL)} />}
        after={chevron()}
        onClick={driver.editCar}
      >
        {t('drivers.application.title')}
      </Cell>
    </Section>
  );
}
