import { REQUESTS_LINK, REQUESTS_LINK_VALUE } from '@platform/contracts';
import { useState, type ReactNode } from 'react';
import { useDirectory } from '../places/use-directory';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { freshStartParam, launchParam, useLinkOpened } from '../telegram/launch-param';
import { RequestsFlow } from '../requests/requests-flow';
import { ErrorBoundary } from '../states/error-boundary';

type Linked = { readonly from: string; readonly to: string; readonly date: string };
// A request a passenger sent into the group of the district: startapp=requests_<from>_<to>_<date>
// (G69, docs/123 loop 2).
const START = `${REQUESTS_LINK}_`;
const PARAMS = [REQUESTS_LINK];

function linkedRequests(): Linked | null {
  const start = freshStartParam() ?? '';
  const value = start.startsWith(START)
    ? start.slice(START.length)
    : launchParam(REQUESTS_LINK, REQUESTS_LINK_VALUE);
  const [, from, to, date] = REQUESTS_LINK_VALUE.exec(value ?? '') ?? [];
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
  useLinkOpened(linked !== null, PARAMS);
  if (!linked) return <>{children}</>;
  const close = () => setLinked(null);
  return (
    <ErrorBoundary onBack={close}>
      <LinkedRequests linked={linked} onClose={close} />
    </ErrorBoundary>
  );
}

// Unknown places open the board of the driver's own directions, never a wrong route.
function LinkedRequests({ linked, onClose }: { readonly linked: Linked; readonly onClose: () => void }) {
  const [state, retry] = useDirectory();
  if (state.status === 'loading') return <ScreenSkeleton onBack={onClose} />;
  if (state.status === 'error') return <ErrorScreen onRetry={retry} onBack={onClose} />;
  const known = state.directory.find(linked.from) && state.directory.find(linked.to);
  return <RequestsFlow onBack={onClose} initial={known ? linked : { date: linked.date }} />;
}
