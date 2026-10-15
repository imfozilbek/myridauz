import './flow.css';
import { OPEN_LINK, OPEN_LINK_VALUE, PROFILE_PHOTO_LINK } from '@platform/contracts';
import { useCallback, useState, type ReactNode } from 'react';
import { ProfileScreen } from '../account/profile/profile-screen';
import type { ProfilePart } from '../account/profile/profile-rows';
import { ErrorBoundary } from '../states/error-boundary';
import { haptic } from '../telegram/feedback';
import { launchParam, useLinkOpened } from '../telegram/launch-param';
import { HomeGoProvider, HomeProvider } from './home-context';
import { HomeScreen } from './home-screen';
import type { HomeGo, Launch, StartAction } from './start-action';
import { UnderSheets } from '../telegram/sheet-shown';

type StartFlowProps = {
  readonly actions: readonly StartAction[];
  // The section to open at once, for a link from a bot (docs/50), maybe at one case (G75).
  readonly opened?: string;
  readonly launch?: Launch;
  // A late offer under the tiles: when it comes, nothing above it moves (G41, docs/108).
  readonly after?: ReactNode;
  // The block of the main screen above the tiles: the team of the admin app (G75).
  readonly home?: (go: HomeGo) => ReactNode;
  // The block «Qayerdan / Qayerga» at the bottom with the main button of its own (G66, docs/118): it
  // decides the button, like «Men keldim» on the day of a trip. The tiles are square then.
  readonly dock?: (go: HomeGo) => ReactNode;
  // Tiles of the app after its actions (G53): they open a section or the profile.
  readonly tiles?: (go: HomeGo, openProfile: OpenProfile) => ReactNode;
  // The right part of the head of the main screen (G76, mockup g76/1): the car or the rating.
  readonly side?: (openProfile: OpenProfile) => ReactNode;
  // Sections opened only by those tiles, not drawn as action tiles (G53).
  readonly sections?: readonly StartAction[];
};
const NO_SECTIONS: readonly StartAction[] = [];
type OpenProfile = (part?: ProfilePart) => void;
type Screen =
  | 'home'
  | { readonly profile: ProfilePart | null }
  | { readonly action: StartAction; readonly launch?: Launch };
const PROFILE: Screen = { profile: null };
const PROFILE_LINK = [PROFILE_PHOTO_LINK.name];
const SECTION_LINK = [OPEN_LINK];
// «Rasmni almashtirish» under a refused face photo opens the profile (G58, docs/118).
const photoLinked = () =>
  launchParam(PROFILE_PHOTO_LINK.name, new RegExp(`^${PROFILE_PHOTO_LINK.id}$`, 'u')) !== null;

// Main screen with at most 3 actions (docs/19) → a section or the own profile.
// The welcome screen opens the registration (account gate), so a registered person lands here.
export function StartFlow(props: StartFlowProps) {
  const { actions, opened, after, home, dock, tiles, side, sections = NO_SECTIONS } = props;
  // A bot button opens its section at once: ?open=<section> (G62, docs/119).
  const [linked] = useState(() => opened ?? launchParam(OPEN_LINK, OPEN_LINK_VALUE));
  const [screen, setScreen] = useState<Screen>(() => {
    const action = [...actions, ...sections].find((item) => item.id === linked);
    if (action) return props.launch ? { action, launch: props.launch } : { action };
    return photoLinked() ? PROFILE : 'home';
  });
  useLinkOpened(screen !== 'home' && 'profile' in screen, PROFILE_LINK);
  // A section opened by ?open= forgets it: the gates mounted again never open «Hamyon» twice (G77).
  useLinkOpened(linked !== null && screen !== 'home', SECTION_LINK);
  const openHome = useCallback(() => setScreen('home'), []);
  const openProfile = useCallback<OpenProfile>((part) => {
    haptic.tap();
    setScreen({ profile: part ?? null });
  }, []);
  const go = useCallback<HomeGo>(
    (id, launch) => {
      const action = [...actions, ...sections].find((item) => item.id === id);
      if (action) setScreen(launch ? { action, launch } : { action });
    },
    [actions, sections],
  );
  if (screen === 'home')
    return (
      <>
        {/* Each block of the main screen has its own boundary: a broken one keeps the others (G52). */}
        <HomeScreen
          square={Boolean(dock)}
          after={after ? <ErrorBoundary>{after}</ErrorBoundary> : undefined}
          top={home ? <ErrorBoundary>{home(go)}</ErrorBoundary> : undefined}
          tiles={tiles ? <ErrorBoundary>{tiles(go, openProfile)}</ErrorBoundary> : undefined}
          side={side ? <ErrorBoundary>{side(openProfile)}</ErrorBoundary> : undefined}
          onProfile={() => openProfile()}
        />
        {/* After the main screen: the block paints the bottom bar after the screen does (G66). It
            stays under the sheets, its buttons step aside while one is open (G76, lesson 199). */}
        {dock ? (
          <UnderSheets.Provider value>
            <ErrorBoundary>{dock(go)}</ErrorBoundary>
          </UnderSheets.Provider>
        ) : null}
      </>
    );
  // A broken section shows the error with «Orqaga» to the main screen: the app goes on (G52).
  if ('profile' in screen)
    return (
      <ErrorBoundary onBack={openHome}>
        <ProfileScreen onBack={openHome} {...(screen.profile ? { part: screen.profile } : {})} />
      </ErrorBoundary>
    );
  const { action, launch } = screen;
  return (
    <ErrorBoundary onBack={openHome}>
      <HomeProvider value={openHome}>
        <HomeGoProvider value={go}>
          <action.Screen onBack={openHome} {...launch} />
        </HomeGoProvider>
      </HomeProvider>
    </ErrorBoundary>
  );
}
