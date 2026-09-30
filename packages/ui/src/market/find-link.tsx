import { useState, type ReactNode } from 'react';
import { useDirectory } from '../places/use-directory';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { startParam } from '../telegram/launch-param';
import { FindTripFlow } from './find-trip-flow';

// "Shu yoʻnalishda safar topish" on the landing: startapp=find_<from>_<to> (docs/59). After the
// registration the search opens with that route, ready for the day.
const START = /^find_(\d{2,10})_(\d{2,10})$/u;
type Ids = { readonly from: string; readonly to: string };

function linkedRoute(): Ids | null {
  const [, from, to] = START.exec(startParam() ?? '') ?? [];
  return from && to ? { from, to } : null;
}

export function FindLink({ enabled, children }: { readonly enabled: boolean; readonly children: ReactNode }) {
  const [ids, setIds] = useState(() => (enabled ? linkedRoute() : null));
  if (!ids) return <>{children}</>;
  return <LinkedSearch ids={ids} onClose={() => setIds(null)} />;
}

// Unknown places start the search from the route, never with a wrong one.
function LinkedSearch({ ids, onClose }: { readonly ids: Ids; readonly onClose: () => void }) {
  const [state, retry] = useDirectory();
  if (state.status === 'loading') return <ScreenSkeleton onBack={onClose} />;
  if (state.status === 'error') return <ErrorScreen onRetry={retry} onBack={onClose} />;
  const from = state.directory.find(ids.from);
  const to = state.directory.find(ids.to);
  return <FindTripFlow onBack={onClose} initial={from && to ? { from, to } : undefined} />;
}
