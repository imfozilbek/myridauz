import { useEffect, useRef, useState } from 'react';
import type { ChatCalling } from '../chat/use-chat';
import { useApiClients } from '../context/api-clients';
import { startTone, unlockTones } from './call-tones';
import { voiceLink, type VoiceLink } from './voice-link';

// The Mini App side of a call (docs/08): the microphone once per call, the voice starts when the
// callee answers, the other voice plays; every failure ends the call and the chat stays.
export function useCall(key: string, chat: ChatCalling) {
  const { calls } = useApiClients();
  const link = useRef<VoiceLink | null>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(false);
  const [noMicrophone, setNoMicrophone] = useState(false);
  const { emit } = chat;
  const status = chat.call?.status ?? null;
  const caller = chat.call?.caller ?? null;

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
      link.current?.stop();
      link.current = null;
    }
  };

  useEffect(() => {
    if (status === 'connecting')
      voice()
        .start()
        .catch(() => emit({ type: 'call', action: 'failed' }));
    if (status === null) {
      link.current?.stop();
      link.current = null;
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
    ring: () => withMicrophone(() => emit({ type: 'call', action: 'ring' })),
    accept: () =>
      withMicrophone(
        () => emit({ type: 'call', action: 'accept' }),
        () => emit({ type: 'call', action: 'decline' }),
      ),
    decline: () => emit({ type: 'call', action: 'decline' }),
    hangUp: () => emit({ type: 'call', action: 'end' }),
    toggleMute: () => {
      voice().mute(!muted);
      setMuted(!muted);
    },
  };
}

export type CallControls = ReturnType<typeof useCall>;
