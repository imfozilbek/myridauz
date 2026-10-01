import type { AnalyticsEvent } from '@platform/contracts';
import { useAnalytics } from '../context/analytics-context';
import { haptic } from '../telegram/feedback';

type HomeTarget = Extract<AnalyticsEvent, { name: 'home_tap' }>['target'];

// Every tap of the main screen is counted by its place (G25, docs/29), then does its work.
export function useHomeTap() {
  const { track } = useAnalytics();
  return (target: HomeTarget, then: () => void) => () => {
    haptic.tap();
    track({ name: 'home_tap', screen: 'home', target });
    then();
  };
}
