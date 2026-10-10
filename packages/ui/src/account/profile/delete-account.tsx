import type { UsersClient } from '@platform/api-client';
import { Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { useScreenView } from '../../context/analytics-context';
import { useBrand } from '../../context/brand-context';
import { useI18n } from '../../context/i18n-context';
import { Screen } from '../../screen/screen';
import { MainButton } from '../../telegram/bottom-button';
import { haptic } from '../../telegram/feedback';
import { useScreenBackground } from '../../telegram/screen-background';
import { brandVars } from '../../theme/brand-vars';
import { useAccount } from '../account-context';
import { StepLayout } from '../step-layout';
import './delete-account.css';
import { DeleteWallet, DeleteWhat } from './delete-what';

type Stage = 'confirm' | 'failed' | 'done';

type ScreenProps = { readonly client: UsersClient; readonly onBack: () => void };

// «Maʼlumotlaringiz oʻchirilsinmi?» (G75, mockup g75/5 A): what goes, the money of a driver that goes
// with it, one red button; then the app starts from the beginning.
export function DeleteAccountScreen({ client, onBack }: ScreenProps) {
  useScreenView('profile.delete');
  useScreenBackground();
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const driver = useAccount()?.app === 'driver';
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
    <div className="delete-page" style={brandVars(colors)}>
      <Screen onBack={onBack} />
      <h1 className="delete-title">
        {t('account.delete.title')}
        <small>{t('account.delete.hint')}</small>
      </h1>
      <DeleteWhat />
      {driver ? <DeleteWallet /> : null}
      {stage === 'failed' ? <Text className="step-error">{t('errors.generic.description')}</Text> : null}
      <button type="button" className="delete-cancel" onClick={onBack}>
        {t('account.delete.cancel')}
      </button>
      <MainButton text={t('account.delete.confirm')} onClick={erase} destructive />
    </div>
  );
}
