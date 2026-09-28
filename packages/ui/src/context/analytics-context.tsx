import type { AnalyticsClient } from '@platform/api-client';
import { createContext, useContext, useEffect } from 'react';

export const AnalyticsContext = createContext<AnalyticsClient | null>(null);

export function useAnalytics(): AnalyticsClient {
  const analytics = useContext(AnalyticsContext);
  if (!analytics) throw new Error('ui.analytics_missing');
  return analytics;
}

// Every screen reports that it was opened: the base of the funnels (docs/29).
export function useScreenView(screen: string): void {
  const { track } = useAnalytics();
  useEffect(() => track({ name: 'screen_open', screen }), [track, screen]);
}
