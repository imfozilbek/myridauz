import {
  CAR_PHOTO_KINDS,
  formatPlate,
  type CarInput,
  type DriverApplication,
  type ModerationReason,
  type ProblemPlace,
} from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { Text } from '@telegram-apps/telegram-ui';
import { useAccount } from '../../account/account-context';
import { CellValue } from '../../account/cell-value';
import { StepLayout } from '../../account/step-layout';
import { Cell, List, Section } from '../../components';
import { useScreenView } from '../../context/analytics-context';
import { useI18n } from '../../context/i18n-context';
import { IconTile } from '../../icon-tile';
import type { IconName } from '../../icons';
import { Screen } from '../../screen/screen';
import { MainButton } from '../../telegram/bottom-button';
import { asksSeats } from '../car-choices';
import { SwatchTile } from '../car-swatch';
import { hasProblem, ProblemNote } from '../problem-note';

export type ReviewTarget = 'make' | 'color' | 'plate' | 'seats' | 'photos';

type ReviewStepProps = {
  readonly car: CarInput;
  readonly photos: DriverApplication['photos'];
  readonly reasons: readonly ModerationReason[];
  readonly recheck: boolean;
  readonly failure: TranslationKey | null;
  readonly onEdit: (target: ReviewTarget) => void;
  readonly onBack: () => void;
  readonly onSend: () => Promise<void>;
};

// icon null: the paint dot of the car.
type Line = {
  readonly icon: IconName | null;
  readonly label: string;
  readonly value: string;
  readonly target: ReviewTarget;
  readonly places?: readonly ProblemPlace[];
};

// Everything on one screen before sending; a tap on a line changes it (docs/19). Every line has
// its icon (G34); a line the team asked to fix is red, with the reason under it (docs/04).
export function ReviewStep({
  car,
  photos,
  reasons,
  recheck,
  failure,
  onEdit,
  onBack,
  onSend,
}: ReviewStepProps) {
  useScreenView('driver.review');
  const { t } = useI18n();
  const face = useAccount()?.profile.hasAvatar === true;
  const shot = (taken: boolean) => t(taken ? 'drivers.photo.done' : 'drivers.photo.take');
  const lines: readonly Line[] = [
    {
      icon: 'car',
      label: t('drivers.review.car'),
      value: `${car.make} ${car.model}`,
      target: 'make',
      places: ['car'],
    },
    { icon: null, label: t('drivers.color.title'), value: t(`drivers.color.${car.color}`), target: 'color' },
    {
      icon: 'plate',
      label: t('drivers.review.plate'),
      value: formatPlate(car.plate),
      target: 'plate',
      places: ['plate'],
    },
    {
      icon: 'seats',
      label: t('drivers.review.seats'),
      value: String(car.seats),
      target: asksSeats(car) ? 'seats' : 'make',
    },
    {
      icon: 'face',
      label: t('drivers.avatar.title'),
      value: shot(face),
      target: 'photos',
      places: ['avatar'],
    },
    {
      icon: 'camera',
      label: t('drivers.photos.title'),
      value: shot(CAR_PHOTO_KINDS.every((kind) => photos[kind])),
      target: 'photos',
      places: CAR_PHOTO_KINDS,
    },
  ];
  const row = ({ icon, label, value, target, places = [] }: Line) => {
    const problem = places.some((place) => hasProblem(reasons, place));
    const notes = places.map((place) => <ProblemNote key={place} reasons={reasons} place={place} />);
    const before =
      icon === null ? (
        <SwatchTile color={car.color} />
      ) : (
        <IconTile name={icon} tone={problem ? 'danger' : 'brand'} />
      );
    return (
      <Cell
        key={label}
        className={problem ? 'cell-problem' : undefined}
        before={before}
        after={<CellValue>{problem ? t('drivers.status.fix') : value}</CellValue>}
        {...(problem ? { description: notes } : {})}
        onClick={() => onEdit(target)}
      >
        {label}
      </Cell>
    );
  };
  return (
    <StepLayout
      icon="applications"
      title={t('drivers.review.title')}
      {...(recheck ? { hint: t('drivers.edit.confirm') } : {})}
    >
      <Screen onBack={onBack} />
      <span className="step-note">
        <ProblemNote reasons={reasons} place="profile" />
      </span>
      <List>
        <Section>{lines.map(row)}</Section>
      </List>
      {failure ? <Text className="step-error">{t(failure)}</Text> : null}
      <MainButton text={t('drivers.review.send')} onClick={onSend} />
    </StepLayout>
  );
}
