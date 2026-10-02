import { nameSchema } from '@platform/contracts';
import { Text } from '@telegram-apps/telegram-ui';
import { useCallback, useState } from 'react';
import { Input, List, Section } from '../../components';
import { useScreenView } from '../../context/analytics-context';
import { useI18n } from '../../context/i18n-context';
import { Screen } from '../../screen/screen';
import { MainButton } from '../../telegram/bottom-button';
import { haptic } from '../../telegram/feedback';
import { StepLayout } from '../step-layout';

type NameStepProps = {
  readonly initial: string;
  readonly onBack: () => void;
  readonly onDone: (name: string) => void;
};

// The name from Telegram is already filled in: most people just press "Continue" (docs/19).
export function NameStep({ initial, onBack, onDone }: NameStepProps) {
  useScreenView('registration.name');
  const { t } = useI18n();
  const [value, setValue] = useState(initial);
  const [invalid, setInvalid] = useState(false);
  const submit = useCallback(() => {
    const name = nameSchema.safeParse(value);
    if (name.success) return onDone(name.data);
    haptic.error();
    setInvalid(true);
  }, [value, onDone]);
  return (
    <StepLayout icon="profile" title={t('account.name.title')} hint={t('account.name.hint')}>
      <Screen onBack={onBack} />
      <List>
        <Section>
          <Input
            placeholder={t('account.name.placeholder')}
            value={value}
            status={invalid ? 'error' : 'default'}
            onChange={(event) => {
              setValue(event.target.value);
              setInvalid(false);
            }}
          />
        </Section>
      </List>
      {invalid ? <Text className="step-error">{t('account.name.invalid')}</Text> : null}
      <MainButton text={t('common.continue')} onClick={submit} />
    </StepLayout>
  );
}
