import type { DriverApplication } from '@platform/contracts';
import { StepLayout } from '../account/step-layout';
import { SupportButton } from '../account/support-button';
import { Cell, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import './driver.css';

type StatusScreenProps = { readonly application: DriverApplication };

// A rejected application (docs/04): every reason on its own line. «Rad etish» is the last word of the
// team (G75, docs/120): no «Tuzatish», a question goes to the support. Waiting and «fix» applications
// look around the app instead (G34, G62, DriverGate). The answer also comes from the driver bot.
export function StatusScreen({ application }: StatusScreenProps) {
  useScreenView(`driver.status.${application.status}`);
  const { t } = useI18n();
  return (
    <StepLayout
      icon="error"
      title={t('drivers.status.rejected.title')}
      hint={t('drivers.status.rejected.hint')}
    >
      <List>
        <Section>
          {application.reasons.map((reason) => (
            <Cell key={reason} className="cell-problem" before={<IconTile name="error" tone="danger" />}>
              {t(`drivers.reason.${reason}`)}
            </Cell>
          ))}
        </Section>
      </List>
      <SupportButton />
    </StepLayout>
  );
}
