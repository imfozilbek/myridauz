import { FACE_REASONS, type FaceDecision, type FaceReason } from '@platform/contracts';
import { useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { ChoiceStep } from '../driver/steps/choice-step';
import { Icon } from '../icons';
import { useBlobUrl } from '../media/use-blob-url';
import { Screen } from '../screen/screen';
import { ActionFailure } from '../states/action-failure';
import { useFailure } from '../states/use-failure';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { CaseButtons } from './case-buttons';
import { CaseHeader } from './case-header';
import type { CaseProps } from './case-props';

const CHECK = 14;
const HOUR = 60;

// The face photo of a passenger (G51, docs/120, mockup g67/2 screen 5): the 3 points the team
// ticks, «Rasm mos», or «Mos emas: sababi» with the first point not ticked chosen.
export function FaceCase({ id, item, progress, onBack, onDone }: CaseProps) {
  const { t } = useI18n();
  const { moderation } = useApiClients();
  const url = useBlobUrl(() => moderation.facePhoto(id), `face:${id}`);
  const [ticked, setTicked] = useState<readonly FaceReason[]>([]);
  const [asking, setAsking] = useState(false);
  const { failure, fail, clear } = useFailure();
  const name = item?.name ?? '';
  const decide = async (decision: FaceDecision) => {
    clear();
    try {
      await moderation.decideFace(id, decision);
      haptic.success();
      onDone('decided');
    } catch (caught) {
      fail(caught);
      setAsking(false);
    }
  };
  if (asking)
    return (
      <ChoiceStep
        screen="navbat.face.reason"
        icon="face"
        title={t('navbat.face.reasonTitle')}
        choices={FACE_REASONS.map((reason) => ({
          value: reason,
          label: t(`moderation.faceReason.${reason}`),
        }))}
        selected={FACE_REASONS.find((reason) => !ticked.includes(reason)) ?? FACE_REASONS[0]}
        onBack={() => setAsking(false)}
        onDone={(reason) => void decide({ action: 'reject', reason })}
      />
    );
  const toggle = (reason: FaceReason) => {
    haptic.select();
    setTicked(ticked.includes(reason) ? ticked.filter((one) => one !== reason) : [...ticked, reason]);
  };
  const waited = (minutes: number) =>
    minutes < HOUR
      ? t('navbat.face.minutes', { count: minutes })
      : t('navbat.face.hours', { count: Math.floor(minutes / HOUR) });
  return (
    <div className="case">
      <Screen onBack={onBack} />
      <CaseHeader title={t('navbat.face.title')} progress={progress} />
      <div className="face-case-photo">{url ? <img src={url} alt={name} /> : null}</div>
      <p className="face-case-who">{t('navbat.face.who', { name })}</p>
      {item ? <p className="face-case-wait">{waited(item.minutes)}</p> : null}
      <div className="case-card">
        {FACE_REASONS.map((reason) => {
          const on = ticked.includes(reason);
          return (
            <button
              key={reason}
              type="button"
              role="checkbox"
              aria-checked={on}
              className={on ? 'face-check face-check-on' : 'face-check'}
              onClick={() => toggle(reason)}
            >
              <span className="face-check-box">
                <Icon name={on ? 'selected' : 'help'} size={CHECK} />
              </span>
              {t(`navbat.face.check.${reason}`)}
            </button>
          );
        })}
      </div>
      <ActionFailure error={failure} />
      <CaseButtons
        actions={[{ labelKey: 'navbat.face.reject', danger: true, onClick: () => setAsking(true) }]}
      />
      <MainButton text={t('navbat.face.approve')} onClick={() => decide({ action: 'approve' })} />
    </div>
  );
}
