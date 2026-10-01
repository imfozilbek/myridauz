import { REQUESTS_LINK, REQUESTS_LINK_VALUE } from '@platform/contracts';
import { useState, type ReactNode } from 'react';
import { useDirectory } from '../places/use-directory';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { forgetLaunchParam, launchParam } from '../telegram/launch-param';
import { RequestsSearchFlow } from './requests-search-flow';

type Linked = { readonly from: string; readonly to: string; readonly date: string };

function linkedRequests(): Linked | null {
  const [, from, to, date] =
    REQUESTS_LINK_VALUE.exec(launchParam(REQUESTS_LINK, REQUESTS_LINK_VALUE) ?? '') ?? [];
  return from && to && date ? { from, to, date } : null;
}

// "Ochish" under a bot message about a new request on a followed route opens the requests of that
// route and day in the driver app (docs/83 N08); back goes to the day, the route, the main screen.
export function RequestsLink({
  enabled,
  children,
}: {
  readonly enabled: boolean;
  readonly children: ReactNode;
}) {
  const [linked, setLinked] = useState(() => (enabled ? linkedRequests() : null));
  if (!linked) return <>{children}</>;
  const close = () => {
    forgetLaunchParam(REQUESTS_LINK);
    setLinked(null);
  };
  return <LinkedRequests linked={linked} onClose={close} />;
}

// Unknown places start from the route, never with a wrong one.
function LinkedRequests({ linked, onClose }: { readonly linked: Linked; readonly onClose: () => void }) {
  const [state, retry] = useDirectory();
  if (state.status === 'loading') return <ScreenSkeleton onBack={onClose} />;
  if (state.status === 'error') return <ErrorScreen onRetry={retry} onBack={onClose} />;
  const from = state.directory.find(linked.from);
  const to = state.directory.find(linked.to);
  const initial = from && to ? { route: { from, to }, date: linked.date } : undefined;
  return <RequestsSearchFlow onBack={onClose} {...(initial ? { initial } : {})} />;
}
