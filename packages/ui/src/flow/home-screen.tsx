import './square-tiles.css';
import type { ReactNode } from 'react';
import { useAccount } from '../account/account-context';
import { useScreenView } from '../context/analytics-context';
import { usePending } from '../driver/driver-context';
import { LanguageSwitcher, useI18n } from '../context/i18n-context';
import { Screen } from '../screen/screen';
import { useScreenBackground } from '../telegram/screen-background';
import { useSettingsButton } from '../telegram/settings-button';
import { HomeProfile } from '../home/home-profile';
import { HomeTile } from './home-tile';
import { HomeTop } from './home-top';
import type { StartAction, TileLive } from './start-action';

type HomeScreenProps = {
  readonly actions: readonly StartAction[];
  readonly notice?: ReactNode;
  readonly after?: ReactNode;
  readonly top?: ReactNode;
  // Tiles of the app after the tiles of its actions: the profile, the last route, the wallet (G53).
  readonly tiles?: ReactNode;
  // Square tiles under the white block at the bottom (G66, docs/121): the main screens of people.
  readonly square?: boolean;
  // A smart tile may open another section, like «Soʻrovim» its request (G66).
  readonly onOpen: (action: StartAction, opens?: TileLive['opens']) => void;
  readonly onProfile: () => void;
};

// The actions are tiles, two in a row (owner decision 04.10.2026, G53). No big title: the Telegram
// header already names the app (owner decision 01.10.2026), so the profile and the trips come first.
// «Sozlamalar» of the ⋮ menu lives here only: inside a path it would throw the path away
// (owner decision 02.10.2026, docs/94 F4).
export function HomeScreen(props: HomeScreenProps) {
  const { actions, notice, after, top, tiles, square = false, onOpen, onProfile } = props;
  useScreenView('home');
  useScreenBackground();
  // The team of the admin app has no profile of its own: no «Sozlamalar» there (G75).
  useSettingsButton(useAccount() ? onProfile : null);
  const pending = usePending();
  return (
    <div className="home">
      {/* No «Назад» on the main screen: Android «Назад» closes the app, as in Telegram. */}
      <Screen />
      <div className="home-stack">
        <HomeProfile onOpen={onProfile} />
        {notice}
        <HomeTop>{top}</HomeTop>
        <div className={square ? 'home-tiles home-tiles-square' : 'home-tiles'}>
          {actions.map((action) => (
            <ActionTile
              key={action.id}
              action={action}
              waiting={pending && Boolean(action.waitsApproval)}
              pale={pending && Boolean(action.waitsApproval || action.paleUntilApproval)}
              onOpen={(opens) => onOpen(action, opens)}
            />
          ))}
          {tiles}
        </div>
        {after}
        <LanguageSwitcher />
      </div>
    </div>
  );
}

type ActionTileProps = {
  readonly action: StartAction;
  readonly waiting: boolean;
  readonly pale: boolean;
  readonly onOpen: (opens?: TileLive['opens']) => void;
};

const NOTHING_LIVE = (): TileLive => ({});

// An action as a tile; what it says live comes from the action itself (G53). While the application
// is checked, an action that waits says when it works; it still opens and explains (docs/86 V7).
// Its icon stays in color, as on the mockup the owner chose (G53).
function ActionTile({ action, waiting, pale, onOpen }: ActionTileProps) {
  const { t } = useI18n();
  const live = (action.useLive ?? NOTHING_LIVE)();
  const hint = waiting ? t('drivers.status.pending.after') : (live.hint ?? t(action.hintKey));
  return (
    <HomeTile
      icon={action.icon}
      tone={action.tone}
      title={live.title ?? t(action.labelKey)}
      hint={hint}
      pale={pale}
      {...(live.badge === undefined ? {} : { badge: live.badge })}
      {...(live.value === undefined ? {} : { value: live.value })}
      {...(live.urgent ? { urgent: true } : {})}
      onClick={() => onOpen(live.opens)}
    />
  );
}
