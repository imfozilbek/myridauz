import './flow.css';
import { useCallback, useState } from 'react';
import { ProfileScreen } from '../account/profile/profile-screen';
import { RouteScreen } from '../places/route-screen';
import { haptic } from '../telegram/feedback';
import { HomeScreen } from './home-screen';
import { SoonScreen } from './soon-screen';
import type { StartAction } from './start-action';

type StartFlowProps = { readonly actions: readonly StartAction[] };
type Screen = 'home' | 'profile' | { readonly action: StartAction; readonly step: 'route' | 'soon' };

// Main screen with at most 3 actions (docs/19) → a section or the own profile.
// The welcome screen opens the registration (account gate), so a registered person lands here.
export function StartFlow({ actions }: StartFlowProps) {
  const [screen, setScreen] = useState<Screen>('home');
  const openHome = useCallback(() => setScreen('home'), []);
  const openProfile = useCallback(() => setScreen('profile'), []);
  const openAction = useCallback((action: StartAction) => {
    haptic.tap();
    setScreen({ action, step: action.route ? 'route' : 'soon' });
  }, []);
  if (screen === 'home') return <HomeScreen actions={actions} onOpen={openAction} onProfile={openProfile} />;
  if (screen === 'profile') return <ProfileScreen onBack={openHome} />;
  const { action } = screen;
  if (screen.step === 'route' && action.route) {
    // Trips and requests arrive in G07: after the route the section says it is coming soon.
    return (
      <RouteScreen
        allowWholeRegion={action.route.wholeRegion}
        onBack={openHome}
        onDone={() => setScreen({ action, step: 'soon' })}
      />
    );
  }
  return <SoonScreen action={action} onBack={openHome} />;
}
