import {
  BLOCK_DAYS,
  formatPlate,
  type ApplicationSummary,
  type BlockInput,
  type Decision,
  type DecisionInput,
} from '@platform/contracts';
import { Title } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { allowBlock } from './ask-block';
import { CellValue } from '../account/cell-value';
import { Cell, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { ChoiceStep } from '../driver/steps/choice-step';
import { EmptyState } from '../states/empty-state';
import { BackButton } from '../telegram/back-button';
import { haptic } from '../telegram/feedback';
import { PhotoGrid } from './photo-grid';
import { ApproveFlow } from './approve-flow';
import { ReasonsStep } from './reasons-step';

type Mode = 'view' | Decision | 'block' | 'decided' | 'blocked';
type ApplicationScreenProps = { readonly application: ApplicationSummary; readonly onBack: () => void };

// One application: the face, the car, the data and the decision (docs/04). Blocking too (docs/17).
export function ApplicationScreen({ application, onBack }: ApplicationScreenProps) {
  useScreenView('moderation.application');
  const { t } = useI18n();
  const { moderation } = useApiClients();
  const [mode, setMode] = useState<Mode>('view');
  const { car, userId } = application;
  const act = async (work: Promise<unknown>, done: Mode) => {
    try {
      await work;
      haptic.success();
      setMode(done);
    } catch {
      haptic.error();
      setMode('view');
    }
  };
  const decide = (decision: DecisionInput) => void act(moderation.decide(userId, decision), 'decided');
  const block = async (days: BlockInput['days']) => {
    if (await allowBlock(days ?? null, t)) await act(moderation.block(userId, days), 'blocked');
  };

  if (mode === 'decided' || mode === 'blocked') {
    return (
      <>
        <BackButton onClick={onBack} />
        <EmptyState
          icon="selected"
          title={t(mode === 'decided' ? 'moderation.decided' : 'moderation.blocked')}
        />
      </>
    );
  }
  if (mode === 'approve') {
    return (
      <ApproveFlow
        application={application}
        onBack={() => setMode('view')}
        onApprove={(plate) => decide(plate ? { action: 'approve', plate } : { action: 'approve' })}
      />
    );
  }
  if (mode === 'reject' || mode === 'request_changes') {
    return (
      <ReasonsStep onBack={() => setMode('view')} onDone={(reasons) => decide({ action: mode, reasons })} />
    );
  }
  if (mode === 'block') {
    const days = [
      ...BLOCK_DAYS.map((value) => ({ value, label: t('moderation.block.days', { days: String(value) }) })),
      { value: null, label: t('moderation.block.forever') },
    ];
    return (
      <ChoiceStep
        screen="moderation.block"
        icon="blocked"
        title={t('moderation.block.title')}
        choices={days}
        onBack={() => setMode('view')}
        onDone={block}
      />
    );
  }
  return (
    <div className="moderation">
      <BackButton onClick={onBack} />
      <Title weight="1" className="moderation-title">
        {application.firstName}
      </Title>
      <PhotoGrid userId={userId} />
      <List>
        <Section>
          <Cell after={<CellValue>{`${car.make} ${car.model}`}</CellValue>}>{t('drivers.review.car')}</Cell>
          <Cell after={<CellValue>{t(`drivers.color.${car.color}`)}</CellValue>}>
            {t('drivers.color.title')}
          </Cell>
          <Cell after={<CellValue>{formatPlate(car.plate)}</CellValue>}>{t('drivers.review.plate')}</Cell>
          <Cell after={<CellValue>{String(car.seats)}</CellValue>}>{t('drivers.review.seats')}</Cell>
        </Section>
        <Section>
          <Cell onClick={() => setMode('approve')}>{t('moderation.approve')}</Cell>
          <Cell onClick={() => setMode('reject')}>{t('moderation.reject')}</Cell>
          <Cell onClick={() => setMode('request_changes')}>{t('moderation.requestChanges')}</Cell>
          <Cell onClick={() => setMode('block')}>{t('moderation.block')}</Cell>
        </Section>
      </List>
    </div>
  );
}
