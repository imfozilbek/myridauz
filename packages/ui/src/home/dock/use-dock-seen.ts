import type { AnalyticsEvent } from '@platform/contracts';
import { useEffect } from 'react';
import { useAnalytics } from '../../context/analytics-context';
import { keepValue, keptValue } from '../../screen/list-memory';

type DockState = Extract<AnalyticsEvent, { name: 'dock_state' }>['state'];
const LAST = 'dock.state';

// The state the block came to is counted once each time it changes (G76, docs/29): the block back
// after a section in the same state is not counted again.
export function useDockSeen(state: DockState): void {
  const { track } = useAnalytics();
  useEffect(() => {
    if (keptValue<DockState>(LAST) === state) return;
    keepValue(LAST, state);
    track({ name: 'dock_state', screen: 'home', state });
  }, [track, state]);
}
