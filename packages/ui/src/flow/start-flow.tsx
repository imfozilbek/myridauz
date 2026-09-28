import './flow.css';
import { useCallback, useState } from 'react';
import { ProfileScreen } from '../account/profile/profile-screen';
import { haptic } from '../telegram/feedback';
import { HomeScreen } from './home-screen';
import { SoonScreen } from './soon-screen';
import type { StartAction } from './start-action';

type StartFlowProps = { readonly actions: readonly StartAction[] };

// Main screen with at most 3 actions (docs/19) → a section or the own profile.
// The welcome screen opens the registration (account gate), so a registered person lands here.
export function StartFlow({ actions }: StartFlowProps) {
  const [screen, setScreen] = useState<'home' | 'profile' | StartAction>('home');
  const openHome = useCallback(() => setScreen('home'), []);
  const openProfile = useCallback(() => setScreen('profile'), []);
  const openAction = useCallback((action: StartAction) => {
    haptic.tap();
    setScreen(action);
  }, []);
  if (screen === 'home') return <HomeScreen actions={actions} onOpen={openAction} onProfile={openProfile} />;
  if (screen === 'profile') return <ProfileScreen onBack={openHome} />;
  return <SoonScreen action={screen} onBack={openHome} />;
}
