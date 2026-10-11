import './square-tiles.css';
import type { CSSProperties, ReactNode } from 'react';
import { useAccount } from '../account/account-context';
import { useScreenView } from '../context/analytics-context';
import { LanguageSwitcher } from '../context/i18n-context';
import { Screen } from '../screen/screen';
import { useScreenBackground } from '../telegram/screen-background';
import { useInTelegram } from '../telegram/in-telegram-context';
import { brandVars } from '../theme/brand-vars';
import { useBrand } from '../context/brand-context';
import { useSettingsButton } from '../telegram/settings-button';
import { HomeProfile } from '../home/home-profile';
import { HomeTop } from './home-top';

type HomeScreenProps = {
  readonly after?: ReactNode;
  readonly top?: ReactNode;
  // Tiles of the app after the tiles of its actions: the profile, the last route, the wallet (G53).
  readonly tiles?: ReactNode;
  // Square tiles under the white block at the bottom (G66, docs/121): the main screens of people.
  readonly square?: boolean;
  // The right part of the head on the main screens of people (G76, mockup g76/1).
  readonly side?: ReactNode;
  readonly onProfile: () => void;
};

// The actions are tiles, two in a row (owner decision 04.10.2026, G53). No big title: the Telegram
// header already names the app (owner decision 01.10.2026), so the profile and the trips come first.
// «Sozlamalar» of the ⋮ menu lives here only: inside a path it would throw the path away
// (owner decision 02.10.2026, docs/94 F4).
export function HomeScreen(props: HomeScreenProps) {
  const { after, top, tiles, square = false, side, onProfile } = props;
  useScreenView('home');
  useScreenBackground();
  // The team of the admin app has no profile of its own: no «Sozlamalar» there (G75).
  useSettingsButton(useAccount() ? onProfile : null);
  const { colors } = useBrand().theme;
  const reserve = useInTelegram() ? DOCK_IN_TELEGRAM : DOCK_IN_BROWSER;
  const style = { ...brandVars(colors), '--dock-reserve': `${reserve}px` } as CSSProperties;
  return (
    <div className="home" style={square ? style : undefined}>
      {/* No «Назад» on the main screen: Android «Назад» closes the app, as in Telegram. */}
      <Screen />
      {square ? (
        <div className="home-stack">
          <div className="home-head">
            <HomeProfile onOpen={onProfile} />
            {side}
          </div>
          <div className="home-tiles home-tiles-square">{tiles}</div>
          {after}
          {top}
          <LanguageSwitcher />
        </div>
      ) : (
        <div className="home-stack">
          <HomeProfile onOpen={onProfile} />
          <HomeTop>{top}</HomeTop>
          <div className="home-tiles">{tiles}</div>
          {after}
          <LanguageSwitcher />
        </div>
      )}
    </div>
  );
}

// The tallest block at the bottom with its arrow (G76, docs/165): the tiles leave it room. In
// Telegram the two buttons are the native bar under the view: 64 px less (50 px buttons and 14 px
// under them, as on the mockups).
const DOCK_IN_BROWSER = 300;
const DOCK_IN_TELEGRAM = 236;
