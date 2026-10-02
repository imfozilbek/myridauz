import {
  CAR_PHOTO_KINDS,
  formatPlate,
  type CarInput,
  type ModerationReason,
  type ProblemPlace,
} from '@platform/contracts';
import { Text } from '@telegram-apps/telegram-ui';
import { CellValue } from '../../account/cell-value';
import { StepLayout } from '../../account/step-layout';
import { Cell, List, Section } from '../../components';
import { useScreenView } from '../../context/analytics-context';
import { useI18n } from '../../context/i18n-context';
import { Screen } from '../../screen/screen';
import { MainButton } from '../../telegram/bottom-button';
import { asksSeats } from '../car-choices';
import { hasProblem, ProblemNote } from '../problem-note';
import type { TranslationKey } from '@platform/i18n';

export type ReviewTarget = 'make' | 'color' | 'plate' | 'seats' | 'avatar' | 'photos';

type ReviewStepProps = {
  readonly car: CarInput;
  readonly reasons: readonly ModerationReason[];
  readonly recheck: boolean;
  readonly failure: TranslationKey | null;
  readonly onEdit: (target: ReviewTarget) => void;
  readonly onBack?: () => void;
  readonly onSend: () => Promise<void>;
};

// Everything on one screen before sending; a tap on a line changes it (docs/19).
// A line the team asked to fix is red, with the reason under it (docs/04).
export function ReviewStep({ car, reasons, recheck, failure, onEdit, onBack, onSend }: ReviewStepProps) {
  useScreenView('driver.review');
  const { t } = useI18n();
  const line = (label: string, value: string, target: ReviewTarget, places: readonly ProblemPlace[] = []) => {
    const problem = places.some((place) => hasProblem(reasons, place));
    const notes = places.map((place) => <ProblemNote key={place} reasons={reasons} place={place} />);
    return (
      <Cell
        className={problem ? 'cell-problem' : undefined}
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
      icon="car"
      title={t('drivers.review.title')}
      {...(recheck ? { hint: t('drivers.edit.confirm') } : {})}
    >
      {onBack ? <Screen onBack={onBack} /> : null}
      <span className="step-note">
        <ProblemNote reasons={reasons} place="profile" />
      </span>
      <List>
        <Section>
          {line(t('drivers.review.car'), `${car.make} ${car.model}`, 'make', ['car'])}
          {line(t('drivers.color.title'), t(`drivers.color.${car.color}`), 'color')}
          {line(t('drivers.review.plate'), formatPlate(car.plate), 'plate', ['plate'])}
          {line(t('drivers.review.seats'), String(car.seats), asksSeats(car) ? 'seats' : 'make')}
          {line(t('drivers.avatar.title'), t('drivers.photo.done'), 'avatar', ['avatar'])}
          {line(t('drivers.photos.title'), t('drivers.photo.done'), 'photos', CAR_PHOTO_KINDS)}
        </Section>
      </List>
      {failure ? <Text className="step-error">{t(failure)}</Text> : null}
      <MainButton text={t('drivers.review.send')} onClick={onSend} />
    </StepLayout>
  );
}
