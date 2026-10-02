import { Text } from '@telegram-apps/telegram-ui';
import { useCallback, useState } from 'react';
import { useScreenView } from '../../context/analytics-context';
import { useI18n } from '../../context/i18n-context';
import { Screen } from '../../screen/screen';
import { MainButton } from '../../telegram/bottom-button';
import { haptic } from '../../telegram/feedback';
import { requestSignedContact } from '../../telegram/permissions';
import { StepLayout } from '../step-layout';

type PhoneStepProps = {
  readonly onBack: () => void;
  // Gets the contact signed by Telegram; resolves false when the server refused it.
  readonly onDone: (signedContact: string) => Promise<boolean>;
};

// The phone is required (docs/10 question 33) and taken only from Telegram: nothing to type.
export function PhoneStep({ onBack, onDone }: PhoneStepProps) {
  useScreenView('registration.phone');
  const { t } = useI18n();
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const share = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    const contact = await requestSignedContact();
    const accepted = contact !== null && (await onDone(contact));
    setBusy(false);
    if (accepted) return;
    haptic.error();
    setFailed(true);
  }, [busy, onDone]);
  const onSend = useCallback(() => void share(), [share]);
  return (
    <StepLayout icon="phone" title={t('account.phone.title')} hint={t('account.phone.hint')}>
      <Screen onBack={onBack} />
      {failed ? <Text className="step-error">{t('account.phone.denied')}</Text> : null}
      <MainButton text={t('account.phone.send')} onClick={onSend} />
    </StepLayout>
  );
}
