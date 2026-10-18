import { BOT_VIA_PARAM, type Moment, type ShareMoment } from '@platform/contracts';
import { useEffect, useState, type ReactNode } from 'react';
import { useApiClients } from '../context/api-clients';
import { startParam } from '../telegram/launch-param';
import { MomentScreen } from './moment-screen';

type Due = Moment & { readonly moment: ShareMoment };
const isDue = (found: Moment): found is Due => found.moment !== null;

// The moment due now, or null; undefined while it loads. A failure is no moment: the page goes on.
function useDueMoment(enabled: boolean): Due | null | undefined {
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

// Opened without a link: a moment not offered yet (the registration, the approval of a driver) once
// per launch, over the page (docs/123). A link opens its own screen. No moment after a trip: the trip
// ends with the stars (owner decision 15.10.2026). The mark of a bot button opens nothing (G87).
let asked = false;
const plainLaunch = () =>
  startParam() === null &&
  [...new URLSearchParams(window.location.search).keys()].every(
    (name) => name.startsWith('tgWebApp') || name === BOT_VIA_PARAM,
  );

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
  return found && !closed ? <MomentScreen found={found} onDone={() => setClosed(true)} /> : <>{children}</>;
}
