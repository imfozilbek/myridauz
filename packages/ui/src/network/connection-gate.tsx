import type { ReactNode } from 'react';
import { Button } from '../components';
import { useI18n } from '../context/i18n-context';
import { EmptyState } from '../states/empty-state';
import { closeApp } from '../telegram/feedback';
import { OfflineBanner } from './offline-banner';
import { useExpired } from './session-expired';

// The whole app knows two things about the connection (G43): the network is gone (a banner above the
// screen, the screen stays) and the launch is too old (one screen: open the app again).
export function ConnectionGate({ children }: { readonly children: ReactNode }) {
  const expired = useExpired();
  const { t } = useI18n();
  if (expired) {
    const close = (
      <Button size="m" onClick={closeApp}>
        {t('common.close')}
      </Button>
    );
    return (
      <EmptyState
        icon="waiting"
        title={t('errors.expired.title')}
        description={t('errors.expired.description')}
        action={close}
      />
    );
  }
  return (
    <>
      <OfflineBanner />
      {children}
    </>
  );
}
