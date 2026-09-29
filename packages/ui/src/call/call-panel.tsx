import type { CallEnding, CallView } from '@platform/contracts';
import { Button, Caption, Text, Title } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import { useI18n } from '../context/i18n-context';
import { Icon, type IconName } from '../icons';
import type { CallControls } from './use-call';
import './call.css';

type Props = {
  readonly name: string;
  readonly call: CallView | null;
  readonly ended: CallEnding | null;
  readonly controls: CallControls;
  readonly onChat: () => void;
};

const SECOND = 1000;
const pad = (value: number) => String(value).padStart(2, '0');
const clock = (ms: number) => `${pad(Math.floor(ms / 60_000))}:${pad(Math.floor(ms / SECOND) % 60)}`;

// The call over the chat, like a Telegram call (docs/08, docs/21): who, where it is, big buttons
// with words. When it ends, one tap goes back to the chat.
export function CallPanel({ name, call, ended, controls, onChat }: Props) {
  const { t } = useI18n();
  const talking = useTalkTime(call?.status === 'active');
  const status = !call
    ? t(`calls.ended.${ended ?? 'ended'}`)
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
        <div className="call-avatar">
          <Icon name="profile" size={48} />
        </div>
        <Title weight="2">{name}</Title>
        <Text className="call-status">{status}</Text>
        {call ? <Caption className="call-hint">{t('calls.keepOpen')}</Caption> : null}
      </div>
      <div className="call-actions">
        {!call ? (
          <Button size="l" stretched onClick={onChat}>
            {t('calls.writeChat')}
          </Button>
        ) : call.status === 'ringing' && call.caller === 'other' ? (
          <>
            <Round icon="hangUp" label={t('calls.decline')} danger onClick={controls.decline} />
            <Round icon="call" label={t('calls.answer')} onClick={() => void controls.accept()} />
          </>
        ) : (
          <>
            {call.status === 'active' ? (
              <Round
                icon={controls.muted ? 'muted' : 'microphone'}
                label={t(controls.muted ? 'calls.unmute' : 'calls.mute')}
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
  readonly onClick: () => void;
};

// A round call button with its word under it: an icon is never alone (docs/19).
function Round({ icon, label, danger = false, onClick }: RoundProps) {
  return (
    <button type="button" className={`call-round${danger ? ' call-danger' : ''}`} onClick={onClick}>
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
