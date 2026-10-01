import { ApiError } from '@platform/api-client';
import type { Gender, MeResponse, RegistrationStep } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useCallback, useState } from 'react';
import { useAnalytics } from '../../context/analytics-context';
import { WelcomeScreen } from '../../flow/welcome-screen';
import type { IconName } from '../../icons';
import { haptic } from '../../telegram/feedback';
import { useUsersClient } from '../account-context';
import { ConsentStep } from './consent-step';
import { GenderStep } from './gender-step';
import { NameStep } from './name-step';
import { PhoneStep } from './phone-step';

type WelcomePoint = { readonly icon: IconName; readonly textKey: TranslationKey };
// The welcome: what the app is for, then what the person gets, before any question (docs/86 T11, T12).
export type Welcome = {
  readonly icon: IconName;
  readonly textKey: TranslationKey;
  readonly points: readonly WelcomePoint[];
};

type RegistrationFlowProps = {
  readonly welcome: Welcome;
  readonly suggestedName: string;
  readonly onFinished: (me: MeResponse) => void;
};

type Screen = 'welcome' | 'consent' | 'name' | 'gender' | 'phone';

// First entry: welcome, consent, name, gender, phone. One question per screen (docs/19, G04).
export function RegistrationFlow({ welcome, suggestedName, onFinished }: RegistrationFlowProps) {
  const client = useUsersClient();
  const { track } = useAnalytics();
  const [screen, setScreen] = useState<Screen>('welcome');
  const [name, setName] = useState(suggestedName);
  const [gender, setGender] = useState<Gender>('male');
  const passed = useCallback(
    (step: RegistrationStep, next?: Screen) => {
      track({ name: 'registration_step', screen: 'registration', step });
      if (next) setScreen(next);
    },
    [track],
  );

  const register = useCallback(
    async (contact: string) => {
      try {
        const me = await client.register({ consent: true, firstName: name, gender, contact });
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
    [client, name, gender, passed, onFinished],
  );

  const toConsent = useCallback(() => setScreen('consent'), []);
  const toName = useCallback(() => setScreen('name'), []);
  const toGender = useCallback(() => setScreen('gender'), []);
  const accept = useCallback(() => passed('consent', 'name'), [passed]);
  const saveName = useCallback(
    (value: string) => {
      setName(value);
      passed('name', 'gender');
    },
    [passed],
  );
  const saveGender = useCallback(
    (value: Gender) => {
      setGender(value);
      passed('gender', 'phone');
    },
    [passed],
  );

  if (screen === 'welcome') return <WelcomeScreen welcome={welcome} onContinue={toConsent} />;
  if (screen === 'consent') return <ConsentStep onAccept={accept} />;
  if (screen === 'name') return <NameStep initial={name} onBack={toConsent} onDone={saveName} />;
  if (screen === 'gender') return <GenderStep onBack={toName} onDone={saveGender} />;
  return <PhoneStep onBack={toGender} onDone={register} />;
}
