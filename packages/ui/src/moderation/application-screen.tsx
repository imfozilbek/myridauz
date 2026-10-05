import {
  BLOCK_DAYS,
  type ApplicationSummary,
  type BlockInput,
  type Decision,
  type DecisionInput,
} from '@platform/contracts';
import { Title } from '@telegram-apps/telegram-ui';
import { useLayoutEffect, useRef, useState } from 'react';
import { allowBlock } from './ask-block';
import { ApplicationCar } from './application-car';
import { ApplicationHistory } from './application-history';
import { BlockJournal } from './block-journal';
import { Cell, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { ChoiceStep } from '../driver/steps/choice-step';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { ActionFailure } from '../states/action-failure';
import { useFailure } from '../states/use-failure';
import { PhotoGrid, PhotoScreen, type PhotoKind } from './photo-grid';
import { ApproveFlow } from './approve-flow';
import { ReasonsStep } from './reasons-step';

type Mode = 'view' | Decision | 'block';
export type Outcome = 'decided' | 'blocked';
type ApplicationScreenProps = {
  readonly application: ApplicationSummary;
  readonly onBack: () => void;
  // After a decision the queue opens the next application at once (docs/89 S9).
  readonly onDone: (outcome: Outcome) => void;
};

// One application: the face, the car, the data and the decision (docs/04). Blocking too (docs/17).
// Approving is the main button at the bottom, rejecting a red row as in Telegram (docs/86 V10).
export function ApplicationScreen({ application, onBack, onDone }: ApplicationScreenProps) {
  useScreenView('moderation.application');
  const { t } = useI18n();
  const { moderation } = useApiClients();
  const [mode, setMode] = useState<Mode>('view');
  const [zoom, setZoom] = useState<PhotoKind | null>(null);
  // A photo opens over the application (docs/94 S7): the history and the journal stay loaded, and
  // closing it brings the application back at the place it had.
  const place = useRef(0);
  const zoomIn = (kind: PhotoKind) => {
    place.current = window.scrollY;
    setZoom(kind);
  };
  useLayoutEffect(() => {
    if (zoom === null && place.current > 0) window.scrollTo(0, place.current);
  }, [zoom]);
  const [fixedPlate, setFixedPlate] = useState<string | null>(null);
  const { car, userId } = application;
  const { failure, fail, clear } = useFailure();
  const act = async (work: Promise<unknown>, outcome: Outcome) => {
    clear();
    try {
      await work;
      haptic.success();
      onDone(outcome);
    } catch (caught) {
      fail(caught);
      setMode('view');
    }
  };
  const decide = (decision: DecisionInput) => void act(moderation.decide(userId, decision), 'decided');
  const block = async (days: BlockInput['days']) => {
    if (await allowBlock(days ?? null, t)) await act(moderation.block(userId, days), 'blocked');
  };

  if (mode === 'approve') {
    return (
      <ApproveFlow
        application={application}
        fixed={fixedPlate}
        onFixed={setFixedPlate}
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
  // While a photo is open only what loads by itself stays, hidden at its place: the history and the
  // journal. The rest is drawn again on the way back.
  const shown = zoom === null;
  return (
    <>
      <div className="moderation" hidden={!shown}>
        {shown ? (
          <>
            <Screen onBack={onBack} />
            <Title weight="1" className="moderation-title">
              {application.firstName}
            </Title>
            <PhotoGrid userId={userId} onOpen={zoomIn} />
          </>
        ) : null}
        <List>
          <ApplicationHistory userId={userId} />
          {shown ? (
            <>
              <ApplicationCar car={car} />
              <Section>
                <Cell onClick={() => setMode('request_changes')}>{t('moderation.requestChanges')}</Cell>
                <Cell onClick={() => setMode('reject')}>
                  <span className="danger-text">{t('moderation.reject')}</span>
                </Cell>
                <Cell onClick={() => setMode('block')}>{t('moderation.block')}</Cell>
              </Section>
            </>
          ) : null}
          <BlockJournal userId={userId} />
          {shown ? <ActionFailure error={failure} /> : null}
        </List>
        {shown ? <MainButton text={t('moderation.approve')} onClick={() => setMode('approve')} /> : null}
      </div>
      {zoom ? <PhotoScreen userId={userId} kind={zoom} onBack={() => setZoom(null)} /> : null}
    </>
  );
}
