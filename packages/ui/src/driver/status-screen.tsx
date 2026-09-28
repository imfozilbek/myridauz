import type { DriverApplication } from '@platform/contracts';
import { StepLayout } from '../account/step-layout';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { MainButton } from '../telegram/bottom-button';

type StatusScreenProps = { readonly application: DriverApplication; readonly onFix: () => void };

// Waiting, or what to fix and how (docs/04). The answer also comes from the driver bot.
export function StatusScreen({ application, onFix }: StatusScreenProps) {
  useScreenView(`driver.status.${application.status}`);
  const { t } = useI18n();
  if (application.status === 'pending') {
    return (
      <StepLayout
        icon="applications"
        title={t('drivers.status.pending.title')}
        hint={t('drivers.status.pending.hint')}
      />
    );
  }
  const title =
    application.status === 'rejected'
      ? 'drivers.status.rejected.title'
      : 'drivers.status.changes_requested.title';
  const reason = application.reason ? t(`drivers.reason.${application.reason}`) : '';
  return (
    <StepLayout icon="error" title={t(title)} hint={t('drivers.status.reason', { reason })}>
      <MainButton text={t('drivers.status.fix')} onClick={onFix} />
    </StepLayout>
  );
}
