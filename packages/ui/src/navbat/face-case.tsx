import { FACE_REASONS, type FaceDecision, type FaceReason } from '@platform/contracts';
import { useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { useBlobUrl } from '../media/use-blob-url';
import { Screen } from '../screen/screen';
import { ActionFailure } from '../states/action-failure';
import { useFailure } from '../states/use-failure';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { CaseHeader } from './case-header';
import type { CaseProps } from './case-props';
import './face-case.css';

const CHECK = 14;
const HOUR = 60;

// The face photo of a passenger (G51, docs/120, mockup g67/2 screen 5): the 3 points the team
// ticks and «Rasm mos»; «Mos emas» at a point refuses the photo for it in one tap (G78 К1).
export function FaceCase({ id, item, progress, onBack, onDone }: CaseProps) {
  const { t } = useI18n();
  const { moderation } = useApiClients();
  const url = useBlobUrl(() => moderation.facePhoto(id), `face:${id}`);
  const [ticked, setTicked] = useState<readonly FaceReason[]>([]);
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
    }
  };
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
          const point = t(`navbat.face.check.${reason}`);
          return (
            <div key={reason} role="group" aria-label={point} className="face-check">
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                className={on ? 'face-check-tick face-check-on' : 'face-check-tick'}
                onClick={() => toggle(reason)}
              >
                <span className="face-check-box">
                  <Icon name={on ? 'selected' : 'help'} size={CHECK} />
                </span>
                {point}
              </button>
              <button
                type="button"
                className="face-not"
                onClick={() => void decide({ action: 'reject', reason })}
              >
                {t('navbat.face.reject')}
              </button>
            </div>
          );
        })}
      </div>
      <ActionFailure error={failure} />
      <MainButton text={t('navbat.face.approve')} onClick={() => decide({ action: 'approve' })} />
    </div>
  );
}
