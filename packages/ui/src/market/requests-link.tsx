import { REQUESTS_LINK, REQUESTS_LINK_VALUE } from '@platform/contracts';
import { useState, type ReactNode } from 'react';
import { useDirectory } from '../places/use-directory';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { forgetLaunchParam, launchParam } from '../telegram/launch-param';
import { RequestsFlow } from '../requests/requests-flow';

type Linked = { readonly from: string; readonly to: string; readonly date: string };

function linkedRequests(): Linked | null {
  const [, from, to, date] =
    REQUESTS_LINK_VALUE.exec(launchParam(REQUESTS_LINK, REQUESTS_LINK_VALUE) ?? '') ?? [];
  return from && to && date ? { from, to, date } : null;
}

// "Ochish" under a bot message about a new request on a followed route opens the requests of that
// route and day in the driver app (docs/83 N08, G64); back goes to the main screen.
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

// Unknown places open the board of the driver's own directions, never a wrong route.
function LinkedRequests({ linked, onClose }: { readonly linked: Linked; readonly onClose: () => void }) {
  const [state, retry] = useDirectory();
  if (state.status === 'loading') return <ScreenSkeleton onBack={onClose} />;
  if (state.status === 'error') return <ErrorScreen onRetry={retry} onBack={onClose} />;
  const known = state.directory.find(linked.from) && state.directory.find(linked.to);
  return <RequestsFlow onBack={onClose} initial={known ? linked : { date: linked.date }} />;
}
