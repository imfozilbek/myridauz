import { formatPlate, type CarInput } from '@platform/contracts';
import { Text } from '@telegram-apps/telegram-ui';
import { CellValue } from '../../account/cell-value';
import { StepLayout } from '../../account/step-layout';
import { Cell, List, Section } from '../../components';
import { useScreenView } from '../../context/analytics-context';
import { useI18n } from '../../context/i18n-context';
import { BackButton } from '../../telegram/back-button';
import { MainButton } from '../../telegram/bottom-button';

export type ReviewTarget = 'make' | 'color' | 'year' | 'plate' | 'seats' | 'photos';

type ReviewStepProps = {
  readonly car: CarInput;
  readonly recheck: boolean;
  readonly failed: boolean;
  readonly onEdit: (target: ReviewTarget) => void;
  readonly onBack?: () => void;
  readonly onSend: () => void;
};

// Everything on one screen before sending; a tap on a line changes it (docs/19).
export function ReviewStep({ car, recheck, failed, onEdit, onBack, onSend }: ReviewStepProps) {
  useScreenView('driver.review');
  const { t } = useI18n();
  const line = (label: string, value: string, target: ReviewTarget) => (
    <Cell after={<CellValue>{value}</CellValue>} onClick={() => onEdit(target)}>
      {label}
    </Cell>
  );
  return (
    <StepLayout
      icon="car"
      title={t('drivers.review.title')}
      {...(recheck ? { hint: t('drivers.edit.confirm') } : {})}
    >
      {onBack ? <BackButton onClick={onBack} /> : null}
      <List>
        <Section>
          {line(t('drivers.review.car'), `${car.make} ${car.model}`, 'make')}
          {line(t('drivers.color.title'), t(`drivers.color.${car.color}`), 'color')}
          {line(t('drivers.year.title'), String(car.year), 'year')}
          {line(t('drivers.review.plate'), formatPlate(car.plate), 'plate')}
          {line(t('drivers.review.seats'), String(car.seats), 'seats')}
          {line(t('drivers.photos.title'), t('drivers.photo.done'), 'photos')}
        </Section>
      </List>
      {failed ? <Text className="step-error">{t('errors.generic.description')}</Text> : null}
      <MainButton text={t('drivers.review.send')} onClick={onSend} />
    </StepLayout>
  );
}
