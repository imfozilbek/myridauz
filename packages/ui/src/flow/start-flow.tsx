import './flow.css';
import { useCallback, useState, type ReactNode } from 'react';
import { ProfileScreen } from '../account/profile/profile-screen';
import { useI18n } from '../context/i18n-context';
import { useHomeTap } from '../home/use-home-tap';
import { ErrorBoundary } from '../states/error-boundary';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { HomeProvider } from './home-context';
import { HomeScreen } from './home-screen';
import { SoonScreen } from './soon-screen';
import type { HomeGo, Launch, StartAction } from './start-action';

type StartFlowProps = {
  readonly actions: readonly StartAction[];
  // The section to open at once, for a link from a bot (docs/50).
  readonly opened?: string;
  // A note above the actions, like the application being checked.
  readonly notice?: ReactNode;
  // A late offer under the actions: when it comes, nothing above it moves (G41, docs/108).
  readonly after?: ReactNode;
  // The trips of the person or the main action, above the actions (G25).
  readonly home?: (go: HomeGo) => ReactNode;
  // The action of the main button: the list does not repeat it (G25). It stays while the home
  // block loads or fails, so the main action is always one tap away.
  readonly covered?: string;
  // The action of the main button stays a tile too (the driver, owner decision 04.10.2026, G53).
  readonly coveredTile?: boolean;
  // Tiles of the app after its actions (G53): they open a section or the profile.
  readonly tiles?: (go: HomeGo, openProfile: () => void) => ReactNode;
  // Sections opened only by those tiles, not drawn as action tiles (G53).
  readonly sections?: readonly StartAction[];
};
const NO_SECTIONS: readonly StartAction[] = [];
type Screen = 'home' | 'profile' | { readonly action: StartAction; readonly launch?: Launch };

// Main screen with at most 3 actions (docs/19) → a section or the own profile.
// The welcome screen opens the registration (account gate), so a registered person lands here.
export function StartFlow(props: StartFlowProps) {
  const { actions, opened, notice, after, home, covered, coveredTile, tiles, sections = NO_SECTIONS } = props;
  const { t } = useI18n();
  const tap = useHomeTap();
  const [screen, setScreen] = useState<Screen>(() => {
    const action = [...actions, ...sections].find((item) => item.id === opened);
    return action ? { action } : 'home';
  });
  const openHome = useCallback(() => setScreen('home'), []);
  const openProfile = useCallback(() => {
    haptic.tap();
    setScreen('profile');
  }, []);
  const openAction = useCallback((action: StartAction) => {
    haptic.tap();
    setScreen({ action });
  }, []);
  const go = useCallback<HomeGo>(
    (id, launch) => {
      const action = [...actions, ...sections].find((item) => item.id === id);
      if (action) setScreen(launch ? { action, launch } : { action });
    },
    [actions, sections],
  );
  if (screen === 'home') {
    const main = actions.find((action) => action.id === covered);
    return (
      <>
        <HomeScreen
          actions={coveredTile ? actions : actions.filter((action) => action !== main)}
          notice={notice}
          after={after}
          top={home ? <ErrorBoundary>{home(go)}</ErrorBoundary> : undefined}
          tiles={tiles?.(go, openProfile)}
          onOpen={openAction}
          onProfile={openProfile}
        />
        {main ? <MainButton text={t(main.labelKey)} onClick={tap('main_button', () => go(main.id))} /> : null}
      </>
    );
  }
  // A broken section shows the error with «Orqaga» to the main screen: the app goes on (G52).
  if (screen === 'profile')
    return (
      <ErrorBoundary onBack={openHome}>
        <ProfileScreen onBack={openHome} />
      </ErrorBoundary>
    );
  const { action, launch } = screen;
  if (!action.Screen) return <SoonScreen action={action} onBack={openHome} />;
  return (
    <ErrorBoundary onBack={openHome}>
      <HomeProvider value={openHome}>
        <action.Screen onBack={openHome} {...launch} />
      </HomeProvider>
    </ErrorBoundary>
  );
}
