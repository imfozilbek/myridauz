import type { DriverApplication } from '@platform/contracts';
import { SupportButton } from '../account/support-button';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { StateScreen } from '../states/state-screen';

type StatusScreenProps = { readonly application: DriverApplication };

// A rejected application (docs/04): the reasons, then a question goes to the support. «Rad etish» is the
// last word of the team (G75, docs/120): no «Tuzatish». Waiting and «fix» applications look around the
// app instead (G34, G62, DriverGate). The answer also comes from the driver bot. As every state: the red
// tile in the middle and one button (G75, mockup g75/1 A).
export function StatusScreen({ application }: StatusScreenProps) {
  useScreenView(`driver.status.${application.status}`);
  const { t } = useI18n();
  return (
    <StateScreen
      icon="error"
      tone="danger"
      title={t('drivers.status.rejected.title')}
      description={application.reasons.map((reason) => t(`drivers.reason.${reason}`)).join(' ')}
      note={t('drivers.status.rejected.hint')}
      button={<SupportButton />}
    />
  );
}
