import { StepLayout } from '../account/step-layout';
import { useI18n } from '../context/i18n-context';
import { Screen } from '../screen/screen';

// Passengers' requests stay private until the driver is checked (docs/04, docs/07).
export function PendingLock({ onBack }: { readonly onBack: () => void }) {
  const { t } = useI18n();
  return (
    <StepLayout
      icon="applications"
      title={t('drivers.status.pending.title')}
      hint={t('drivers.status.pending.requests')}
    >
      <Screen onBack={onBack} />
    </StepLayout>
  );
}
