import { Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { useScreenView } from '../../context/analytics-context';
import { useI18n } from '../../context/i18n-context';
import { Screen } from '../../screen/screen';
import { MainButton } from '../../telegram/bottom-button';
import { haptic } from '../../telegram/feedback';
import type { UsersClient } from '@platform/api-client';
import { StepLayout } from '../step-layout';

type Stage = 'confirm' | 'failed' | 'done';

// One screen explains what is removed, one button removes it; then the app starts from the beginning.
type ScreenProps = { readonly client: UsersClient; readonly onBack: () => void };

export function DeleteAccountScreen({ client, onBack }: ScreenProps) {
  useScreenView('profile.delete');
  const { t } = useI18n();
  const [stage, setStage] = useState<Stage>('confirm');
  if (stage === 'done') {
    return (
      <StepLayout hero icon="selected" title={t('account.delete.done')} hint={t('account.delete.doneHint')}>
        <MainButton text={t('account.delete.close')} onClick={() => window.location.reload()} />
      </StepLayout>
    );
  }
  const erase = () => {
    client.deleteMe().then(
      () => {
        haptic.success();
        setStage('done');
      },
      () => {
        haptic.error();
        setStage('failed');
      },
    );
  };
  return (
    <StepLayout icon="erase" title={t('account.delete.title')} hint={t('account.delete.hint')}>
      <Screen onBack={onBack} />
      {stage === 'failed' ? <Text className="step-error">{t('errors.generic.description')}</Text> : null}
      <MainButton text={t('account.delete.confirm')} onClick={erase} destructive />
    </StepLayout>
  );
}
