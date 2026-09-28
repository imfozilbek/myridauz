import './flow.css';
import type { TranslationKey } from '@platform/i18n';
import { useCallback, useState } from 'react';
import type { IconName } from '../icons';
import { haptic } from '../telegram/feedback';
import { HomeScreen } from './home-screen';
import { SoonScreen } from './soon-screen';
import type { StartAction } from './start-action';
import { WelcomeScreen } from './welcome-screen';

type StartFlowProps = {
  readonly welcomeIcon: IconName;
  readonly welcome: TranslationKey;
  readonly actions: readonly StartAction[];
};

// Welcome → main screen with at most 3 actions (docs/19) → a section. Sections arrive in later goals.
export function StartFlow({ welcomeIcon, welcome, actions }: StartFlowProps) {
  const [screen, setScreen] = useState<'welcome' | 'home' | StartAction>('welcome');
  const openHome = useCallback(() => setScreen('home'), []);
  const openAction = useCallback((action: StartAction) => {
    haptic.tap();
    setScreen(action);
  }, []);
  if (screen === 'welcome')
    return <WelcomeScreen icon={welcomeIcon} textKey={welcome} onContinue={openHome} />;
  if (screen === 'home') return <HomeScreen actions={actions} onOpen={openAction} />;
  return <SoonScreen action={screen} onBack={openHome} />;
}
