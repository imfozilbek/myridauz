import { carSchema, formatPlate, maskPlate, type ModerationReason } from '@platform/contracts';
import { Text } from '@telegram-apps/telegram-ui';
import { useCallback, useState } from 'react';
import { StepLayout } from '../../account/step-layout';
import { useScreenView } from '../../context/analytics-context';
import { useI18n } from '../../context/i18n-context';
import { BackButton } from '../../telegram/back-button';
import { MainButton } from '../../telegram/bottom-button';
import { haptic } from '../../telegram/feedback';
import { hasProblem, ProblemNote } from '../problem-note';

type PlateStepProps = {
  readonly initial: string;
  readonly reasons: readonly ModerationReason[];
  readonly onBack: () => void;
  readonly onDone: (plate: string) => void;
};

// The plate is the only thing a driver types: it is unique to the car (docs/04).
// The field looks like an Uzbek plate. Each place takes only a digit or only a letter,
// and the rest of the example stays grey after what is typed (maskPlate, docs/50).
export function PlateStep({ initial, reasons, onBack, onDone }: PlateStepProps) {
  useScreenView('driver.plate');
  const { t } = useI18n();
  const [value, setValue] = useState(formatPlate(initial));
  const [invalid, setInvalid] = useState(false);
  const submit = useCallback(() => {
    const plate = carSchema.shape.plate.safeParse(value);
    if (plate.success) return onDone(plate.data);
    haptic.error();
    setInvalid(true);
  }, [value, onDone]);
  return (
    <StepLayout icon="car" title={t('drivers.plate.title')} hint={t('drivers.plate.hint')}>
      <BackButton onClick={onBack} />
      <label className={invalid || hasProblem(reasons, 'plate') ? 'plate plate-problem' : 'plate'}>
        <span className="plate-field">
          <span className="plate-ghost" aria-hidden>
            <span className="plate-typed">{value}</span>
            {maskPlate(value).ghost}
          </span>
          <input
            className="plate-input"
            value={value}
            aria-label={t('drivers.plate.title')}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => {
              setValue(maskPlate(event.target.value).value);
              setInvalid(false);
            }}
          />
        </span>
        <span className="plate-country">{t('drivers.plate.country')}</span>
      </label>
      <span className="step-note">
        <ProblemNote reasons={reasons} place="plate" />
      </span>
      {invalid ? <Text className="step-error">{t('drivers.plate.invalid')}</Text> : null}
      <MainButton text={t('common.continue')} onClick={submit} />
    </StepLayout>
  );
}
