import type { DriverApplication } from '@platform/contracts';
import { StepLayout } from '../account/step-layout';
import { Cell, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { MainButton } from '../telegram/bottom-button';
import './driver.css';

type StatusScreenProps = { readonly application: DriverApplication; readonly onFix: () => void };

// A rejected application (docs/04): every reason on its own line, the same places are red in the
// application. Waiting and «fix» applications look around the app instead (G34, G62, DriverGate).
// The answer also comes from the driver bot.
export function StatusScreen({ application, onFix }: StatusScreenProps) {
  useScreenView(`driver.status.${application.status}`);
  const { t } = useI18n();
  return (
    <StepLayout icon="error" title={t('drivers.status.rejected.title')} hint={t('drivers.status.fixHint')}>
      <List>
        <Section>
          {application.reasons.map((reason) => (
            <Cell
              key={reason}
              className="cell-problem"
              before={<IconTile name="error" tone="danger" />}
              onClick={onFix}
            >
              {t(`drivers.reason.${reason}`)}
            </Cell>
          ))}
        </Section>
      </List>
      <MainButton text={t('drivers.status.fix')} onClick={onFix} />
    </StepLayout>
  );
}
