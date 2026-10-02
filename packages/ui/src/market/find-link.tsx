import { useState, type ReactNode } from 'react';
import { useDirectory } from '../places/use-directory';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { FIND_LINK, REQUESTS_LINK_VALUE } from '@platform/contracts';
import { forgetLaunchParam, launchParam, startParam } from '../telegram/launch-param';
import { FindTripFlow } from './find-trip-flow';

// "Shu yoʻnalishda safar topish" on the landing: startapp=find_<from>_<to> (docs/59). After the
// registration the search opens with that route, ready for the day. «Boshqa safar topish» of a bot
// message brings the day too: ?find=<from>_<to>_<date> (docs/89 S10).
const START = /^find_(\d{2,10})_(\d{2,10})$/u;
export type RouteIds = { readonly from: string; readonly to: string; readonly day?: string };

function linkedRoute(): RouteIds | null {
  const [, from, to, day] = REQUESTS_LINK_VALUE.exec(launchParam(FIND_LINK, REQUESTS_LINK_VALUE) ?? '') ?? [];
  if (from && to && day) return { from, to, day };
  const [, landingFrom, landingTo] = START.exec(startParam() ?? '') ?? [];
  return landingFrom && landingTo ? { from: landingFrom, to: landingTo } : null;
}

export function FindLink({ enabled, children }: { readonly enabled: boolean; readonly children: ReactNode }) {
  const [ids, setIds] = useState(() => (enabled ? linkedRoute() : null));
  if (!ids) return <>{children}</>;
  const close = () => {
    forgetLaunchParam(FIND_LINK);
    setIds(null);
  };
  return <LinkedSearch ids={ids} onClose={close} />;
}

// Unknown places start the search from the route, never with a wrong one.
export function LinkedSearch({ ids, onClose }: { readonly ids: RouteIds; readonly onClose: () => void }) {
  const [state, retry] = useDirectory();
  if (state.status === 'loading') return <ScreenSkeleton onBack={onClose} />;
  if (state.status === 'error') return <ErrorScreen onRetry={retry} onBack={onClose} />;
  const from = state.directory.find(ids.from);
  const to = state.directory.find(ids.to);
  return <FindTripFlow onBack={onClose} initial={from && to ? { from, to } : undefined} day={ids.day} />;
}
