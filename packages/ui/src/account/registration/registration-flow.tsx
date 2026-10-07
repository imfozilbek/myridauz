import { ApiError, type UsersClient } from '@platform/api-client';
import type { LegalDocument, MeResponse, RegistrationStep } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useCallback, useContext, useRef, useState } from 'react';
import { useAnalytics } from '../../context/analytics-context';
import { WelcomeScreen } from '../../flow/welcome-screen';
import type { IconName } from '../../icons';
import { LegalScreen } from '../../legal/legal-screen';
import { launchArrival } from '../../telegram/arrival';
import { haptic } from '../../telegram/feedback';
import { requestBotMessages } from '../../telegram/permissions';
import { TelegramContext } from '../../telegram/in-telegram-context';
import { useUsersClient } from '../account-context';
import { AboutStep, type Answers, type Registration } from './about-step';
import { bothAccepted, ConsentChecks, type Consents } from './consent-line';

type WelcomePoint = { readonly icon: IconName; readonly textKey: TranslationKey };
// The welcome (G58, docs/118): the logo file of the app (docs/36) and «Nima uchun» rows.
export type Welcome = { readonly logo: string; readonly points: readonly WelcomePoint[] };

// The answer of screen 1 is kept after the registration: Telegram is not asked a second time.
async function saveBotAccess(client: UsersClient, me: MeResponse): Promise<MeResponse> {
  if (me.state !== 'active') return me;
  const saved = await client.setWriteAccess(true).then(
    () => true,
    () => false,
  );
  return saved ? { ...me, profile: { ...me.profile, writeAccess: true } } : me;
}

// The face goes up right after the registration: only a registered person has a place for it.
// A failed upload is asked again by the gate: the photo is required (G58, docs/128 §1).
async function savePhoto(client: UsersClient, me: MeResponse, photo: Blob): Promise<MeResponse> {
  if (me.state !== 'active') return me;
  const saved = await client.uploadAvatar(photo).then(
    () => true,
    () => false,
  );
  return saved ? { ...me, profile: { ...me.profile, hasAvatar: true } } : me;
}

type RegistrationFlowProps = {
  readonly welcome: Welcome;
  readonly suggestedName: string;
  readonly onFinished: (me: MeResponse) => void;
};

// First entry in two screens (G34): the welcome with the consent, then «Siz haqingizda» with the phone.
export function RegistrationFlow({ welcome, suggestedName, onFinished }: RegistrationFlowProps) {
  const client = useUsersClient();
  const { track } = useAnalytics();
  const { client: app } = useContext(TelegramContext);
  const [screen, setScreen] = useState<'welcome' | 'about'>('welcome');
  // A document opened from a consent: «Orqaga» comes back to the welcome with the same ticks.
  const [reading, setReading] = useState<LegalDocument | null>(null);
  const [consents, setConsents] = useState<Consents>({ offer: false, data: false });
  const botAllowed = useRef<Promise<boolean>>(Promise.resolve(false));
  const [answers, setAnswers] = useState<Answers>({ photo: null, name: suggestedName, gender: null });
  const passed = useCallback(
    (step: RegistrationStep) => track({ name: 'registration_step', screen: 'registration', step }),
    [track],
  );

  const accept = useCallback(() => {
    passed('consent');
    // The bot may write from the first step: trip news reach the person (docs/124 Ж). Telegram
    // asks once; after the registration the answer is saved without a second question.
    botAllowed.current = requestBotMessages().catch(() => false);
    setScreen('about');
  }, [passed]);
  const toWelcome = useCallback(() => setScreen('welcome'), []);
  const answered = useCallback(() => passed('about'), [passed]);
  const register = useCallback(
    async (registration: Registration) => {
      try {
        // Where the person came from, kept once as the first touch (G55, docs/116).
        const { photo, ...person } = registration;
        const registered = await client.register({ consent: true, ...person, came: launchArrival(app) });
        const withPhoto = await savePhoto(client, registered, photo);
        const me = (await botAllowed.current) ? await saveBotAccess(client, withPhoto) : withPhoto;
        passed('phone');
        passed('done');
        haptic.success();
        onFinished(me);
        return true;
      } catch (error) {
        // A blocked phone: the gate shows the block screen (docs/17).
        if (error instanceof ApiError && error.code === 'users.blocked')
          onFinished({ state: 'blocked', until: null });
        return false;
      }
    },
    [client, app, passed, onFinished],
  );

  if (reading) return <LegalScreen document={reading} onBack={() => setReading(null)} />;
  if (screen === 'welcome')
    return (
      <WelcomeScreen welcome={welcome} ready={bothAccepted(consents)} onContinue={accept}>
        <ConsentChecks value={consents} onChange={setConsents} onOpen={setReading} />
      </WelcomeScreen>
    );
  return (
    <AboutStep
      answers={answers}
      onChange={setAnswers}
      onBack={toWelcome}
      onAnswered={answered}
      onSend={register}
    />
  );
}
