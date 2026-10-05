import type { AnalyticsClient } from '@platform/api-client';
import { createContext, useContext, useEffect } from 'react';
import { launchArrival } from '../telegram/arrival';
import { TelegramContext } from '../telegram/in-telegram-context';

export const AnalyticsContext = createContext<AnalyticsClient | null>(null);

export function useAnalytics(): AnalyticsClient {
  const analytics = useContext(AnalyticsContext);
  if (!analytics) throw new Error('ui.analytics_missing');
  return analytics;
}

// The first screen of a launch says where the person came from and on what (docs/89 S3, G55).
let arrivalSent = false;

// The screen opened last: an error of the screen names it (G52, docs/112).
const FIRST_SCREEN = 'app';
let current = FIRST_SCREEN;
export const currentScreen = () => current;

// Every screen reports that it was opened: the base of the funnels (docs/29). The first one of a
// launch also says where the person came from.
export function useScreenView(screen: string): void {
  const { track } = useAnalytics();
  const { client } = useContext(TelegramContext);
  useEffect(() => {
    current = screen;
    const first = arrivalSent ? {} : launchArrival(client);
    arrivalSent = true;
    track({ name: 'screen_open', screen, ...first });
  }, [track, screen, client]);
}
