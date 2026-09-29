import './flow.css';
import { useCallback, useState, type ReactNode } from 'react';
import { ProfileScreen } from '../account/profile/profile-screen';
import { haptic } from '../telegram/feedback';
import { HomeScreen } from './home-screen';
import { SoonScreen } from './soon-screen';
import type { StartAction } from './start-action';

type StartFlowProps = {
  readonly actions: readonly StartAction[];
  // The section to open at once, for a link from a bot (docs/50).
  readonly opened?: string;
  // A note above the actions, like the application being checked.
  readonly notice?: ReactNode;
};
type Screen = 'home' | 'profile' | { readonly action: StartAction };

// Main screen with at most 3 actions (docs/19) → a section or the own profile.
// The welcome screen opens the registration (account gate), so a registered person lands here.
export function StartFlow({ actions, opened, notice }: StartFlowProps) {
  const [screen, setScreen] = useState<Screen>(() => {
    const action = actions.find((item) => item.id === opened);
    return action ? { action } : 'home';
  });
  const openHome = useCallback(() => setScreen('home'), []);
  const openProfile = useCallback(() => setScreen('profile'), []);
  const openAction = useCallback((action: StartAction) => {
    haptic.tap();
    setScreen({ action });
  }, []);
  if (screen === 'home') {
    return <HomeScreen actions={actions} notice={notice} onOpen={openAction} onProfile={openProfile} />;
  }
  if (screen === 'profile') return <ProfileScreen onBack={openHome} />;
  const { action } = screen;
  if (action.Screen) return <action.Screen onBack={openHome} />;
  return <SoonScreen action={action} onBack={openHome} />;
}
