import type { AnalyticsEvent } from '@platform/contracts';
import { useEffect } from 'react';
import { useAnalytics } from '../../context/analytics-context';

type DockState = Extract<AnalyticsEvent, { name: 'dock_state' }>['state'];

// The state the block came to is counted once each time it changes (G76, docs/29).
export function useDockSeen(state: DockState): void {
  const { track } = useAnalytics();
  useEffect(() => {
    track({ name: 'dock_state', screen: 'home', state });
  }, [track, state]);
}
