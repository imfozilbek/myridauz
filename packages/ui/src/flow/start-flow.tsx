import './flow.css';
import { OPEN_LINK, OPEN_LINK_VALUE, PROFILE_PHOTO_LINK } from '@platform/contracts';
import { useCallback, useState, type ReactNode } from 'react';
import { ProfileScreen } from '../account/profile/profile-screen';
import { useI18n } from '../context/i18n-context';
import { useHomeTap } from '../home/use-home-tap';
import { ErrorBoundary } from '../states/error-boundary';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { launchParam, useLinkOpened } from '../telegram/launch-param';
import { HomeProvider } from './home-context';
import { HomeScreen } from './home-screen';
import type { HomeGo, Launch, StartAction, TileLive } from './start-action';
import { useAnySheet } from '../telegram/sheet-shown';

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
  // The block «Qayerdan / Qayerga» at the bottom with the main button of its own (G66, docs/118): it
  // decides the button, like «Mashinaga chiqdim» on the day of a trip. The tiles are square then.
  readonly dock?: (go: HomeGo) => ReactNode;
  // Tiles of the app after its actions (G53): they open a section or the profile.
  readonly tiles?: (go: HomeGo, openProfile: () => void) => ReactNode;
  // Sections opened only by those tiles, not drawn as action tiles (G53).
  readonly sections?: readonly StartAction[];
};
const NO_SECTIONS: readonly StartAction[] = [];
type Screen = 'home' | 'profile' | { readonly action: StartAction; readonly launch?: Launch };
const PROFILE_LINK = [PROFILE_PHOTO_LINK.name];
// «Rasmni almashtirish» under a refused face photo opens the profile (G58, docs/118).
const photoLinked = () =>
  launchParam(PROFILE_PHOTO_LINK.name, new RegExp(`^${PROFILE_PHOTO_LINK.id}$`, 'u')) !== null;

// Main screen with at most 3 actions (docs/19) → a section or the own profile.
// The welcome screen opens the registration (account gate), so a registered person lands here.
export function StartFlow(props: StartFlowProps) {
  const { actions, opened, notice, after, home, covered, dock, tiles, sections = NO_SECTIONS } = props;
  const { t } = useI18n();
  const tap = useHomeTap();
  const sheet = useAnySheet();
  const [screen, setScreen] = useState<Screen>(() => {
    // A bot button opens its section at once: ?open=<section> (G62, docs/119).
    const linked = opened ?? launchParam(OPEN_LINK, OPEN_LINK_VALUE);
    const action = [...actions, ...sections].find((item) => item.id === linked);
    if (action) return { action };
    return photoLinked() ? 'profile' : 'home';
  });
  useLinkOpened(screen === 'profile', PROFILE_LINK);
  const openHome = useCallback(() => setScreen('home'), []);
  const openProfile = useCallback(() => {
    haptic.tap();
    setScreen('profile');
  }, []);
  const go = useCallback<HomeGo>(
    (id, launch) => {
      const action = [...actions, ...sections].find((item) => item.id === id);
      if (action) setScreen(launch ? { action, launch } : { action });
    },
    [actions, sections],
  );
  const openAction = useCallback(
    (action: StartAction, opens?: TileLive['opens']) => {
      haptic.tap();
      if (opens) go(opens.id, opens.launch);
      else setScreen({ action });
    },
    [go],
  );
  if (screen === 'home') {
    const main = actions.find((action) => action.id === covered);
    return (
      <>
        <HomeScreen
          actions={actions.filter((action) => action !== main)}
          square={Boolean(dock)}
          notice={notice}
          after={after}
          top={home ? <ErrorBoundary>{home(go)}</ErrorBoundary> : undefined}
          tiles={tiles?.(go, openProfile)}
          onOpen={openAction}
          onProfile={openProfile}
        />
        {/* After the main screen: the block paints the bottom bar after the screen does (G66). It
            stands above the sheets of the screen, so it leaves while one is open (G68, lesson 199). */}
        {sheet ? null : dock?.(go)}
        {/* Under a sheet the native button would cover its buttons (mockups g60/6, g60/7). */}
        {main && !dock && !sheet ? (
          <MainButton text={t(main.labelKey)} onClick={tap('main_button', () => go(main.id))} />
        ) : null}
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
  return (
    <ErrorBoundary onBack={openHome}>
      <HomeProvider value={openHome}>
        <action.Screen onBack={openHome} {...launch} />
      </HomeProvider>
    </ErrorBoundary>
  );
}
