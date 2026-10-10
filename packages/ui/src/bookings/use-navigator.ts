import { navigatorUrl, type Navigator, type Point } from '@platform/contracts';
import { useState } from 'react';
import { useAnalytics } from '../context/analytics-context';
import { usePlatform } from '../telegram/in-telegram-context';
import { haptic, openExternal } from '../telegram/feedback';
import { navigatorsFor, savedNavigator, saveNavigator } from './navigator-choice';

// «Yoʻl koʻrsatish» (docs/70): the stops open in the navigator of the driver. The first time the sheet
// of the app asks which one (asking), in Telegram too (G75, mockup g75/6 A).
export function useNavigator() {
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
    // «Sozlamalar» chooses with no stops: nothing opens (G75).
    if (stops && stops.length > 0) open(chosen, stops);
  };
  const go = (stops: readonly Point[]) => (navigator ? open(navigator, stops) : setAsking(stops));
  // «Navigator» in «Sozlamalar» (G75, docs/124 Ё): only the choice, nothing opens.
  const change = () => setAsking([]);
  return { navigator, navigators, asking, go, pick, change, cancel: () => setAsking(null) };
}
