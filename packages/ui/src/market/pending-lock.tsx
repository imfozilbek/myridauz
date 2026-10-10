import { useI18n } from '../context/i18n-context';
import { useNotSent } from '../driver/driver-context';
import { Screen } from '../screen/screen';
import { StateScreen } from '../states/state-screen';

// Passengers' requests stay private until the driver is checked (docs/04, docs/07): a state of the
// mockup g75/1 A, as a limit or a block.
export function PendingLock({ onBack }: { readonly onBack: () => void }) {
  const { t } = useI18n();
  const notSent = useNotSent();
  return (
    <>
      <Screen onBack={onBack} />
      <StateScreen
        icon="applications"
        title={t(notSent ? 'drivers.application.title' : 'drivers.status.pending.title')}
        description={t('drivers.status.pending.requests')}
      />
    </>
  );
}
