import { navigatorUrl, type Navigator, type Point } from '@platform/contracts';
import { useState } from 'react';
import { useAnalytics } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { usePlatform } from '../telegram/in-telegram-context';
import { choose, haptic, openExternal } from '../telegram/feedback';
import { navigatorsFor, savedNavigator, saveNavigator } from './navigator-choice';

// «Yoʻl koʻrsatish» (docs/70): the stops open in the navigator of the driver. The first time the
// native Telegram window asks which one; outside Telegram the screen shows the choice (asking).
export function useNavigator() {
  const { t } = useI18n();
  const { track } = useAnalytics();
  const navigators = navigatorsFor(usePlatform());
  const [navigator, setNavigator] = useState(savedNavigator);
  const [asking, setAsking] = useState<readonly Point[] | null>(null);
  const open = (chosen: Navigator, stops: readonly Point[]) => {
    const url = navigatorUrl(chosen, stops);
    if (!url) return;
    track({ name: 'route_opened', screen: 'bookings.trip_map', navigator: chosen });
    haptic.tap();
    openExternal(url);
  };
  const pick = (chosen: Navigator, stops: readonly Point[] | null) => {
    saveNavigator(chosen);
    setNavigator(chosen);
    setAsking(null);
    if (stops) open(chosen, stops);
  };
  // Asks which navigator; with stops, opens them in the chosen one.
  const ask = async (stops: readonly Point[] | null) => {
    const options = navigators.map((id) => ({ id, text: t(`way.navigator.${id}`) }));
    const answer = await choose(t('way.map.navigator'), options);
    if (answer === undefined) return setAsking(stops ?? []);
    const chosen = navigators.find((id) => id === answer);
    if (chosen) pick(chosen, stops);
  };
  const go = (stops: readonly Point[]) => (navigator ? open(navigator, stops) : void ask(stops));
  return {
    navigator,
    navigators,
    asking,
    go,
    change: () => void ask(null),
    pick,
    cancel: () => setAsking(null),
  };
}
