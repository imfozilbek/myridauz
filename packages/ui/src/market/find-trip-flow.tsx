import { TRIP_LINK, type AppLink, type Trip } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { useAnalytics } from '../context/analytics-context';
import { FindStart } from '../find/find-start';
import type { SeatChoice } from '../find/seat-choice';
import type { Route } from '../places/route-screen';
import { forgetList } from '../screen/list-memory';
import { FindResults } from './find-results';
import { useForgetOnLeave } from './list-leave';
import { NewRequestFlow } from './new-request-flow';
import { rememberRoute } from './recent-routes';
import { PlacesGate } from './places-gate';
import { TripById } from './trip-link';
import { NO_FILTERS, type TripFilters } from './trip-filters';
import { RESULTS } from './use-trip-search';

export type FindScreen =
  | { readonly step: 'route'; readonly route?: Route }
  | { readonly step: 'request'; readonly route: Route; readonly date: string }
  | {
      readonly step: 'results';
      readonly route: Route;
      readonly date?: string;
      readonly open?: Trip;
      readonly booking?: SeatChoice;
      readonly district?: boolean;
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
  // A new trip of a saved driver from the main screen (G60): that trip, ready to book.
  readonly link?: AppLink;
};

// A passenger looks for a trip (G59, docs/118 path 2): «Qayerga borasiz?» with the main directions,
// then at once the trips of the nearest day with trips. The points come only at the booking.
export function FindTripFlow({ link, ...props }: Props) {
  if (link?.name !== TRIP_LINK) return <FindTrip {...props} />;
  return (
    <PlacesGate onBack={props.onBack}>
      <TripById id={link.id} onClose={props.onBack} />
    </PlacesGate>
  );
}

function FindTrip({ onBack, initial, route: recent, day, pick }: Omit<Props, 'link'>) {
  const { track } = useAnalytics();
  const known = initial ?? recent;
  const [screen, setScreen] = useState<FindScreen>(
    known ? { step: 'results', route: known, ...(day ? { date: day } : {}) } : { step: 'route' },
  );
  const [now] = useState(Date.now);
  const [filters, setFilters] = useState<TripFilters>(NO_FILTERS);
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
      <FindStart
        {...(screen.route ? { from: screen.route.from } : pick ? { pick } : {})}
        onBack={onBack}
        onDone={(route) => {
          step('done');
          rememberRoute(route);
          setScreen({ step: 'results', route });
        }}
      />
    );
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
      onHome={onBack}
      onScreen={setScreen}
    />
  );
}
