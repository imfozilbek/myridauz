import { carSchema } from '@platform/contracts';
import { Text } from '@telegram-apps/telegram-ui';
import { useCallback, useState } from 'react';
import { StepLayout } from '../../account/step-layout';
import { Input, List, Section } from '../../components';
import { useScreenView } from '../../context/analytics-context';
import { useI18n } from '../../context/i18n-context';
import { BackButton } from '../../telegram/back-button';
import { MainButton } from '../../telegram/bottom-button';
import { haptic } from '../../telegram/feedback';

type PlateStepProps = {
  readonly initial: string;
  readonly onBack: () => void;
  readonly onDone: (plate: string) => void;
};

// The plate is the only thing a driver types: it is unique to the car (docs/04).
export function PlateStep({ initial, onBack, onDone }: PlateStepProps) {
  useScreenView('driver.plate');
  const { t } = useI18n();
  const [value, setValue] = useState(initial);
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
      <List>
        <Section>
          <Input
            placeholder={t('drivers.plate.hint')}
            value={value}
            status={invalid ? 'error' : 'default'}
            onChange={(event) => {
              setValue(event.target.value);
              setInvalid(false);
            }}
          />
        </Section>
      </List>
      {invalid ? <Text className="step-error">{t('drivers.plate.invalid')}</Text> : null}
      <MainButton text={t('common.continue')} onClick={submit} />
    </StepLayout>
  );
}
