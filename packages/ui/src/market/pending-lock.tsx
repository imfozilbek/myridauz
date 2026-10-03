import { StepLayout } from '../account/step-layout';
import { useI18n } from '../context/i18n-context';
import { useNotSent } from '../driver/driver-context';
import { Screen } from '../screen/screen';

// Passengers' requests stay private until the driver is checked (docs/04, docs/07).
export function PendingLock({ onBack }: { readonly onBack: () => void }) {
  const { t } = useI18n();
  const notSent = useNotSent();
  return (
    <StepLayout
      icon="applications"
      title={t(notSent ? 'drivers.application.title' : 'drivers.status.pending.title')}
      hint={t('drivers.status.pending.requests')}
    >
      <Screen onBack={onBack} />
    </StepLayout>
  );
}
