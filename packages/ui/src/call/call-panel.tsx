import type { CallEnding, CallView, ChatAbout } from '@platform/contracts';
import { Button, Caption } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import { useI18n } from '../context/i18n-context';
import { Icon, type IconName } from '../icons';
import { CallTalk } from '../talk/call-talk';
import { TripCard } from '../trip/trip-card';
import { CallPerson } from './call-person';
import type { CallControls } from './use-call';
import './call.css';

type Props = {
  readonly name: string;
  // Which trip the call is about, when the chat has a booking (G54).
  readonly about: ChatAbout | null;
  readonly call: CallView | null;
  readonly ended: CallEnding | null;
  readonly controls: CallControls;
  readonly onChat: () => void;
  // An offer sent or taken during the call changes the talk (G64).
  readonly onChanged: () => unknown;
};

const SECOND = 1000;
const pad = (value: number) => String(value).padStart(2, '0');
const clock = (ms: number) => `${pad(Math.floor(ms / 60_000))}:${pad(Math.floor(ms / SECOND) % 60)}`;

// The call (owner decision 06.10.2026, docs/118 path 3, mockup g60/4): a soft mint screen, the face
// in a ring, the car and its plate, the one card of the trip, big buttons with words. When it ends,
// one tap goes back to the chat.
export function CallPanel({ name, about, call, ended, controls, onChat, onChanged }: Props) {
  const { t } = useI18n();
  const talking = useTalkTime(call?.status === 'active');
  const status = !call
    ? controls.unavailable
      ? t('errors.calls.unavailable')
      : t(`calls.ended.${ended ?? 'ended'}`)
    : call.status === 'active'
      ? clock(talking)
      : call.status === 'connecting'
        ? t('calls.connecting')
        : call.caller === 'me'
          ? t('calls.calling')
          : t('calls.incoming');
  return (
    <div className="call" role="dialog" aria-label={t('calls.call')}>
      <audio ref={controls.audio} autoPlay />
      <div className="call-who">
        <CallPerson about={about} name={name} />
        <span className={call?.status === 'active' ? 'call-status call-clock' : 'call-status'}>{status}</span>
        {about?.booking ? (
          <div className="call-card">
            <TripCard booking={about.booking} />
          </div>
        ) : about ? (
          <CallTalk about={about} onChanged={onChanged} />
        ) : null}
        {call ? <span className="call-hint">{t('calls.keepOpen')}</span> : null}
      </div>
      <div className="call-actions">
        {!call ? (
          <Button size="l" stretched onClick={onChat}>
            {t('calls.writeChat')}
          </Button>
        ) : call.status === 'ringing' && call.caller === 'other' ? (
          <>
            <Round icon="hangUp" label={t('calls.decline')} danger onClick={controls.decline} />
            <Round icon="phone" label={t('calls.answer')} onClick={() => void controls.accept()} />
          </>
        ) : (
          <>
            {call.status === 'active' ? (
              <Round
                icon={controls.muted ? 'muted' : 'microphone'}
                label={t(controls.muted ? 'calls.unmute' : 'calls.mute')}
                soft
                onClick={controls.toggleMute}
              />
            ) : null}
            <Round icon="hangUp" label={t('calls.hangUp')} danger onClick={controls.hangUp} />
          </>
        )}
      </div>
    </div>
  );
}

type RoundProps = {
  readonly icon: IconName;
  readonly label: string;
  readonly danger?: boolean;
  // A white round with a coloured icon: the microphone (mockup g60/4).
  readonly soft?: boolean;
  readonly onClick: () => void;
};

// A round call button with its word under it: an icon is never alone (docs/19).
function Round({ icon, label, danger = false, soft = false, onClick }: RoundProps) {
  const look = danger ? ' call-danger' : soft ? ' call-soft' : '';
  return (
    <button type="button" className={`call-round${look}`} onClick={onClick}>
      <span className="call-round-icon">
        <Icon name={icon} size={28} />
      </span>
      <Caption>{label}</Caption>
    </button>
  );
}

// Seconds of the talk, from the moment the voice connected.
function useTalkTime(active: boolean): number {
  const [started, setStarted] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return setStarted(null);
    setStarted(Date.now());
    const timer = setInterval(() => setNow(Date.now()), SECOND);
    return () => clearInterval(timer);
  }, [active]);
  return started === null ? 0 : Math.max(0, now - started);
}
