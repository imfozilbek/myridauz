import type { AnalyticsClient } from '@platform/api-client';
import { createContext, useContext, useEffect } from 'react';
import { startParam } from '../telegram/launch-param';

export const AnalyticsContext = createContext<AnalyticsClient | null>(null);

export function useAnalytics(): AnalyticsClient {
  const analytics = useContext(AnalyticsContext);
  if (!analytics) throw new Error('ui.analytics_missing');
  return analytics;
}

// The kind of the startapp link (find, trip, sub ...) or «direct» (docs/89 S3).
const KIND = /^[a-z]{1,16}(?=_|$)/u;
const DIRECT = 'direct';
let sourceSent = false;
function launchSource(): string | undefined {
  if (sourceSent) return undefined;
  sourceSent = true;
  const param = startParam();
  return param === null ? DIRECT : (KIND.exec(param)?.[0] ?? 'other');
}

// The screen opened last: an error of the screen names it (G52, docs/112).
const FIRST_SCREEN = 'app';
let current = FIRST_SCREEN;
export const currentScreen = () => current;

// Every screen reports that it was opened: the base of the funnels (docs/29). The first one of a
// launch also says where the person came from.
export function useScreenView(screen: string): void {
  const { track } = useAnalytics();
  useEffect(() => {
    current = screen;
    const source = launchSource();
    track({ name: 'screen_open', screen, ...(source ? { source } : {}) });
  }, [track, screen]);
}
