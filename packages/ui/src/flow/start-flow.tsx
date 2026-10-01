import './flow.css';
import { useCallback, useState, type ReactNode } from 'react';
import { ProfileScreen } from '../account/profile/profile-screen';
import { haptic } from '../telegram/feedback';
import { HomeScreen } from './home-screen';
import { SoonScreen } from './soon-screen';
import type { HomeGo, Launch, StartAction } from './start-action';

type StartFlowProps = {
  readonly actions: readonly StartAction[];
  // The section to open at once, for a link from a bot (docs/50).
  readonly opened?: string;
  // A note above the actions, like the application being checked.
  readonly notice?: ReactNode;
  // The trips of the person or the main action, above the actions (G25).
  readonly home?: (go: HomeGo) => ReactNode;
};
type Screen = 'home' | 'profile' | { readonly action: StartAction; readonly launch?: Launch };

// Main screen with at most 3 actions (docs/19) → a section or the own profile.
// The welcome screen opens the registration (account gate), so a registered person lands here.
export function StartFlow({ actions, opened, notice, home }: StartFlowProps) {
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
  const go = useCallback<HomeGo>(
    (id, launch) => {
      const action = actions.find((item) => item.id === id);
      if (action) setScreen(launch ? { action, launch } : { action });
    },
    [actions],
  );
  if (screen === 'home') {
    return (
      <HomeScreen
        actions={actions}
        notice={notice}
        top={home?.(go)}
        onOpen={openAction}
        onProfile={openProfile}
      />
    );
  }
  if (screen === 'profile') return <ProfileScreen onBack={openHome} />;
  const { action, launch } = screen;
  if (action.Screen) return <action.Screen onBack={openHome} {...launch} />;
  return <SoonScreen action={action} onBack={openHome} />;
}
