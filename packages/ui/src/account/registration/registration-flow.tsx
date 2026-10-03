import { ApiError } from '@platform/api-client';
import type { LegalDocument, MeResponse, RegistrationStep } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useCallback, useState } from 'react';
import { useAnalytics } from '../../context/analytics-context';
import { WelcomeScreen } from '../../flow/welcome-screen';
import type { IconName } from '../../icons';
import { LegalScreen } from '../../legal/legal-screen';
import { haptic } from '../../telegram/feedback';
import { useUsersClient } from '../account-context';
import { AboutStep, type Answers, type Registration } from './about-step';
import { ConsentLine } from './consent-line';

type WelcomePoint = { readonly icon: IconName; readonly textKey: TranslationKey };
// The welcome: what the app is for, then what the person gets, before any question (docs/86 T11, T12).
export type Welcome = { readonly textKey: TranslationKey; readonly points: readonly WelcomePoint[] };

type RegistrationFlowProps = {
  readonly welcome: Welcome;
  readonly suggestedName: string;
  readonly onFinished: (me: MeResponse) => void;
};

// First entry in two screens (G34): the welcome with the consent, then «Siz haqingizda» with the phone.
export function RegistrationFlow({ welcome, suggestedName, onFinished }: RegistrationFlowProps) {
  const client = useUsersClient();
  const { track } = useAnalytics();
  const [screen, setScreen] = useState<'welcome' | 'about'>('welcome');
  // A document opened from the consent line: «Orqaga» comes back to the welcome.
  const [reading, setReading] = useState<LegalDocument | null>(null);
  const [answers, setAnswers] = useState<Answers>({ name: suggestedName, gender: null });
  const passed = useCallback(
    (step: RegistrationStep) => track({ name: 'registration_step', screen: 'registration', step }),
    [track],
  );

  const accept = useCallback(() => {
    passed('consent');
    setScreen('about');
  }, [passed]);
  const toWelcome = useCallback(() => setScreen('welcome'), []);
  const answered = useCallback(() => passed('about'), [passed]);
  const register = useCallback(
    async (registration: Registration) => {
      try {
        const me = await client.register({ consent: true, ...registration });
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
    [client, passed, onFinished],
  );

  if (reading) return <LegalScreen document={reading} onBack={() => setReading(null)} />;
  if (screen === 'welcome')
    return (
      <WelcomeScreen welcome={welcome} onContinue={accept}>
        <ConsentLine onOpen={setReading} />
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
