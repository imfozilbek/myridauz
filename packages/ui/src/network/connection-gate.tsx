import type { ReactNode } from 'react';
import { useI18n } from '../context/i18n-context';
import { StateScreen } from '../states/state-screen';
import { MainButton } from '../telegram/bottom-button';
import { closeApp } from '../telegram/feedback';
import { OfflineBanner } from './offline-banner';
import { useExpired } from './session-expired';

// The whole app knows two things about the connection (G43): the network is gone (a banner above the
// screen, the screen stays) and the launch is too old (one screen: open the app again).
export function ConnectionGate({ children }: { readonly children: ReactNode }) {
  const expired = useExpired();
  const { t } = useI18n();
  if (expired)
    return (
      <StateScreen
        icon="reopen"
        title={t('errors.expired.title')}
        description={t('errors.expired.description')}
        button={<MainButton text={t('common.close')} onClick={closeApp} />}
      />
    );
  return (
    <>
      <OfflineBanner />
      {children}
    </>
  );
}
