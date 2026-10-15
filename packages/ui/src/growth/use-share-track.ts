import type { GrowthLoop } from '@platform/contracts';
import { useEffect } from 'react';
import { useAnalytics } from '../context/analytics-context';

type Target = 'story' | 'chat';

// share_shown once a button of a loop is on the screen, share_done once it shared (docs/123, docs/29):
// which button and moment people press, and where to.
export function useShareTrack(button: GrowthLoop, screen: string) {
  const { track } = useAnalytics();
  useEffect(() => {
    track({ name: 'share_shown', button, screen });
  }, [track, button, screen]);
  // No target: a download (the QR of a driver).
  return (target?: Target) => track({ name: 'share_done', button, screen, ...(target ? { target } : {}) });
}
