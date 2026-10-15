import type { Moment, ShareMoment } from '@platform/contracts';
import { useEffect, useState, type ReactNode } from 'react';
import { useApiClients } from '../context/api-clients';
import { PlacesGate } from '../market/places-gate';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { startParam } from '../telegram/launch-param';
import { MomentScreen } from './moment-screen';

type Due = Moment & { readonly moment: ShareMoment };
const isDue = (found: Moment): found is Due => found.moment !== null;

// The moment due now, or null; undefined while it loads. A failure is no moment: the path goes on.
function useDueMoment(enabled = true): Due | null | undefined {
  const { growth } = useApiClients();
  const [found, setFound] = useState<Due | null | undefined>(enabled ? undefined : null);
  useEffect(() => {
    if (!enabled) return undefined;
    let live = true;
    growth
      .moment()
      .then((moment) => live && setFound(isDue(moment) ? moment : null))
      .catch(() => live && setFound(null));
    return () => {
      live = false;
    };
  }, [growth, enabled]);
  return found;
}

const celebrate = (found: Due, onDone: () => void) => (
  <PlacesGate onBack={onDone}>
    <MomentScreen found={found} onDone={onDone} />
  </PlacesGate>
);

// After the review and after «Safar tugadi» (docs/124: the review, the celebration, then «Qaytish»):
// the moment due, or straight on.
export function MomentStep({ onDone }: { readonly onDone: () => void }) {
  const found = useDueMoment();
  useEffect(() => {
    if (found === null) onDone();
  }, [found, onDone]);
  return found ? celebrate(found, onDone) : <ScreenSkeleton onBack={onDone} />;
}

// Opened without a link: a moment not offered yet (the registration, the approval of a driver, a trip
// the person did not rate) once per launch, over the page (docs/123). A link opens its own screen.
let asked = false;
const plainLaunch = () =>
  startParam() === null &&
  [...new URLSearchParams(window.location.search).keys()].every((name) => name.startsWith('tgWebApp'));

export function MomentGate({
  enabled,
  children,
}: {
  readonly enabled: boolean;
  readonly children: ReactNode;
}) {
  const [ask] = useState(() => enabled && !asked && plainLaunch());
  const found = useDueMoment(ask);
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    if (ask) asked = true;
  }, [ask]);
  return found && !closed ? celebrate(found, () => setClosed(true)) : <>{children}</>;
}
