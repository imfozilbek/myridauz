import type { Trip } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { useAnalytics } from '../context/analytics-context';
import { RouteScreen, type Route } from '../places/route-screen';
import { forgetList } from '../screen/list-memory';
import { DateStep } from './date-step';
import { FindResults } from './find-results';
import { useForgetOnLeave } from './list-leave';
import { NewRequestFlow } from './new-request-flow';
import { rememberRoute } from './recent-routes';
import { type TripFilters } from './trip-results';
import { RESULTS } from './use-trip-search';

export type FindScreen =
  | { readonly step: 'route'; readonly route?: Route }
  | { readonly step: 'calendar'; readonly route: Route; readonly date: string }
  | { readonly step: 'request'; readonly route: Route; readonly date: string }
  | {
      readonly step: 'results';
      readonly route: Route;
      readonly date?: string;
      readonly open?: Trip;
      readonly booking?: boolean;
    };

type Props = {
  readonly onBack: () => void;
  readonly initial?: Route | undefined;
  // A recent route of the main screen (G35, docs/97 K5): its trips at once.
  readonly route?: Route;
  // A bot button or «Shu kungi boshqa safarlar»: the trips of that day at once (docs/89 S10, P8).
  readonly day?: string | undefined;
  // From the main screen: the list of one end opens at once (G25).
  readonly pick?: 'from' | 'to';
};

// A passenger looks for a trip (G26, G35, docs/97): the route by lists, then at once the trips of
// the nearest day with trips; the day changes on the results. The points come only at the booking.
export function FindTripFlow({ onBack, initial, route: recent, day, pick }: Props) {
  const { track } = useAnalytics();
  const known = initial ?? recent;
  const [screen, setScreen] = useState<FindScreen>(
    known ? { step: 'results', route: known, ...(day ? { date: day } : {}) } : { step: 'route' },
  );
  const [now] = useState(Date.now);
  const [filters, setFilters] = useState<TripFilters>({ woman: false, door: false });
  const step = (name: 'opened' | 'from' | 'to' | 'done') =>
    track({ name: 'way_step', screen: 'market.route', step: name });
  useEffect(() => {
    if (!known) step('opened');
    // Once, when the search opens.
  }, []);
  // Back from the results, or the search closed: the next results open fresh (docs/94 F2).
  useEffect(() => {
    if (screen.step !== 'results') forgetList(RESULTS);
  }, [screen.step]);
  useForgetOnLeave(RESULTS);
  if (screen.step === 'route')
    return (
      <RouteScreen
        allowWholeRegion
        quick
        {...(screen.route ? { initial: screen.route } : { pick: pick ?? 'to' })}
        onBack={onBack}
        onEnd={step}
        onDone={(route) => {
          step('done');
          rememberRoute(route);
          setScreen({ step: 'results', route });
        }}
      />
    );
  if (screen.step === 'calendar') {
    const { route, date } = screen;
    return (
      <DateStep
        now={now}
        initial={date}
        calendar
        onBack={() => setScreen({ step: 'results', route, date })}
        onDone={(chosen) => setScreen({ step: 'results', route, date: chosen })}
      />
    );
  }
  if (screen.step === 'request') {
    const { route, date } = screen;
    return (
      <NewRequestFlow
        onBack={() => setScreen({ step: 'results', route, date })}
        onClose={onBack}
        search={{ route, date }}
      />
    );
  }
  return (
    <FindResults
      screen={screen}
      now={now}
      filters={filters}
      onFilters={setFilters}
      onBack={() => setScreen({ step: 'route', route: screen.route })}
      onScreen={setScreen}
    />
  );
}
