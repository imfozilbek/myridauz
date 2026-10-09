import { useI18n } from '../context/i18n-context';
import { FindStart } from '../find/find-start';
import type { StartAction } from '../flow/start-action';
import { PlacePicker } from '../places/place-picker';
import { useDirectory } from '../places/use-directory';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { useDockEnds } from './dock-ends';
import { useHomeRoute } from './home-route';
import { TRIP_TALK, TripTalk } from './trip-talk';

export const DOCK_FROM = 'dock_from';
export const DOCK_TO = 'dock_to';

type Props = { readonly onBack: () => void };

// «Qayerdan» of the block at the bottom of the main screen (G66): the list of places, then back.
function PickFrom({ onBack }: Props) {
  const { t } = useI18n();
  const { choose } = useHomeRoute();
  const [places, retry] = useDirectory();
  if (places.status === 'loading') return <ScreenSkeleton onBack={onBack} />;
  if (places.status === 'error') return <ErrorScreen onRetry={retry} onBack={onBack} />;
  return (
    <PlacePicker
      title={t('places.fromTitle')}
      directory={places.directory}
      allowWholeRegion
      onPick={(from) => {
        choose({ from });
        onBack();
      }}
      onBack={onBack}
    />
  );
}

// «Qayerga» of a driver (G66, mockup g66/2): the list of places, the trip is published from the block.
function PickPlaceTo({ onBack }: Props) {
  const { t } = useI18n();
  const { choose } = useHomeRoute();
  const [places, retry] = useDirectory();
  if (places.status === 'loading') return <ScreenSkeleton onBack={onBack} />;
  if (places.status === 'error') return <ErrorScreen onRetry={retry} onBack={onBack} />;
  return (
    <PlacePicker
      title={t('home.dock.toDriver')}
      directory={places.directory}
      allowWholeRegion
      onPick={(to) => {
        choose({ to });
        onBack();
      }}
      onBack={onBack}
    />
  );
}

// «Qayerga» opens the directions with their drawings and trips (G59, docs/118); the pick comes back
// to the main screen, «Safar topish» then opens its days and trips (mockup g66/1 phone 2).
function PickTo({ onBack }: Props) {
  const { choose } = useHomeRoute();
  const [places] = useDirectory();
  const { from } = useDockEnds(places.status === 'ready' ? places.directory : null);
  return (
    <FindStart
      {...(from ? { from } : { pick: 'from' as const })}
      onBack={onBack}
      onDone={(route) => {
        choose(route.from.id === from?.id ? { to: route.to } : route);
        onBack();
      }}
    />
  );
}

// Opened only by the block and the card of the seat, never drawn as tiles.
export const PASSENGER_SECTIONS: readonly StartAction[] = [
  {
    id: DOCK_FROM,
    icon: 'origin',
    tone: 'brand',
    labelKey: 'places.from',
    hintKey: 'places.fromTitle',
    Screen: PickFrom,
  },
  {
    id: DOCK_TO,
    icon: 'destination',
    tone: 'brand',
    labelKey: 'places.to',
    hintKey: 'places.toTitle',
    Screen: PickTo,
  },
  {
    id: TRIP_TALK,
    icon: 'chat',
    tone: 'brand',
    labelKey: 'chat.open',
    hintKey: 'chat.open',
    Screen: TripTalk,
  },
];

export const DRIVER_DOCK_SECTIONS: readonly StartAction[] = [
  {
    id: DOCK_FROM,
    icon: 'origin',
    tone: 'brand',
    labelKey: 'places.from',
    hintKey: 'places.fromTitle',
    Screen: PickFrom,
  },
  {
    id: DOCK_TO,
    icon: 'destination',
    tone: 'brand',
    labelKey: 'places.to',
    hintKey: 'home.dock.toDriver',
    Screen: PickPlaceTo,
  },
];
