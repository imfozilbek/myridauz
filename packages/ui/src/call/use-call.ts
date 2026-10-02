import { ApiError } from '@platform/api-client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ChatCalling } from '../chat/use-chat';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { holdClosing } from '../screen/closing';
import { confirm } from '../telegram/feedback';
import { startTone, unlockTones } from './call-tones';
import { voiceLink, type VoiceLink } from './voice-link';

// The Mini App side of a call (docs/08): the microphone once per call, the voice starts when the
// callee answers, the other voice plays; every failure ends the call and the chat stays.
// A live call holds the app: Telegram asks before closing, «Назад» asks to end it (docs/94 F5).
export function useCall(key: string, chat: ChatCalling) {
  const { calls } = useApiClients();
  const { t } = useI18n();
  const link = useRef<VoiceLink | null>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(false);
  const [noMicrophone, setNoMicrophone] = useState(false);
  // Calls switched off on the server: this side reads why and writes in the chat (docs/86 T9).
  const [unavailable, setUnavailable] = useState(false);
  const { emit } = chat;
  const status = chat.call?.status ?? null;
  const caller = chat.call?.caller ?? null;
  const inCall = status !== null;
  const live = useRef(inCall);
  live.current = inCall;

  // Ringback for the caller, a ring for the callee, only while it rings (docs/08).
  useEffect(() => {
    if (status !== 'ringing' || !caller) return undefined;
    return startTone(caller === 'me' ? 'ringback' : 'ring');
  }, [status, caller]);

  const voice = () =>
    (link.current ??= voiceLink(
      {
        ice: () => calls.ice(key),
        connect: (offer, mid, trackName) => calls.connect(key, offer, mid, trackName),
        pull: (sessionId, remote) => calls.pull(key, sessionId, remote),
        renegotiate: (sessionId, answer) => calls.renegotiate(key, sessionId, answer),
      },
      {
        onPublished: (track) => emit({ type: 'callTrack', track }),
        onConnected: () => emit({ type: 'call', action: 'connected' }),
        onFailed: () => emit({ type: 'call', action: 'failed' }),
        onRemote: (stream) => {
          if (!audio.current) return;
          audio.current.srcObject = stream;
          void Promise.resolve(audio.current.play()).catch(() => undefined);
        },
      },
    ));

  // The microphone off and the peer connection closed: nothing of the call stays on.
  const drop = () => {
    link.current?.stop();
    link.current = null;
  };

  useEffect(() => (inCall ? holdClosing() : undefined), [inCall]);

  // Leaving the chat in any way ends the call: the other side hears it while the socket is still
  // open (a layout cleanup runs before the chat closes it), the microphone goes off.
  useLayoutEffect(
    () => () => {
      if (live.current) emit({ type: 'call', action: 'end' });
      drop();
    },
    [],
  );

  // No microphone, no call: the other side hears that it failed, this side goes back to the chat.
  const withMicrophone = async (then: () => void, otherwise: () => void = () => undefined) => {
    // The tap itself opens the sound on iPhone.
    unlockTones();
    try {
      setNoMicrophone(false);
      await voice().microphone();
      then();
    } catch {
      setNoMicrophone(true);
      otherwise();
      drop();
    }
  };

  useEffect(() => {
    if (status === 'connecting')
      voice()
        .start()
        .catch((error: unknown) => {
          setUnavailable(error instanceof ApiError && error.code === 'calls.unavailable');
          emit({ type: 'call', action: 'failed' });
        });
    if (status === null) {
      drop();
      setMuted(false);
    }
  }, [status]);

  chat.onTrack.current = (track) => {
    voice()
      .pull(track)
      .catch(() => emit({ type: 'call', action: 'failed' }));
  };

  return {
    audio,
    muted,
    noMicrophone,
    unavailable,
    ring: () => withMicrophone(() => emit({ type: 'call', action: 'ring' })),
    accept: () =>
      withMicrophone(
        () => emit({ type: 'call', action: 'accept' }),
        () => emit({ type: 'call', action: 'decline' }),
      ),
    decline: () => emit({ type: 'call', action: 'decline' }),
    hangUp: () => emit({ type: 'call', action: 'end' }),
    // «Назад» of the chat: in a call it asks «Qoʻngʻiroqni tugatasizmi?»; yes leaves, which ends it.
    leave: (then: () => void) => () => {
      if (!live.current) return then();
      void confirm(t('calls.endAsk'), t('calls.hangUp')).then((yes) => yes && then());
    },
    toggleMute: () => {
      voice().mute(!muted);
      setMuted(!muted);
    },
  };
}

export type CallControls = ReturnType<typeof useCall>;
