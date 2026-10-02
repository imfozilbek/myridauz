import type { Trip } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { BookFlow } from '../bookings/book-flow';
import { useAnalytics } from '../context/analytics-context';
import { RouteScreen, type Route } from '../places/route-screen';
import { DateStep } from './date-step';
import { PlacesGate } from './places-gate';
import { TripResults, type TripFilters } from './trip-results';
import { TripScreen } from './trip-screen';

type Screen =
  | { readonly step: 'route'; readonly route?: Route }
  | { readonly step: 'date'; readonly route: Route }
  | {
      readonly step: 'results';
      readonly route: Route;
      readonly date: string;
      readonly open?: Trip;
      readonly booking?: boolean;
    };

type Props = {
  readonly onBack: () => void;
  readonly initial?: Route | undefined;
  // From the main screen: the list of one end opens at once (G25).
  readonly pick?: 'from' | 'to';
};

// A passenger looks for a trip (G26, docs/74): the route by lists, a day, all the trips of the
// route. The points come only at the booking. A link of the landing brings the districts (docs/59).
export function FindTripFlow({ onBack, initial, pick }: Props) {
  const { track } = useAnalytics();
  const [screen, setScreen] = useState<Screen>(
    initial ? { step: 'date', route: initial } : { step: 'route' },
  );
  const [now] = useState(Date.now);
  const [filters, setFilters] = useState<TripFilters>({ woman: false, door: false });
  const step = (name: 'opened' | 'from' | 'to' | 'done') =>
    track({ name: 'way_step', screen: 'market.route', step: name });
  useEffect(() => {
    if (!initial) step('opened');
    // Once, when the search opens.
  }, []);
  if (screen.step === 'route')
    return (
      <RouteScreen
        allowWholeRegion
        {...(screen.route ? { initial: screen.route } : pick ? { pick } : {})}
        onBack={onBack}
        onEnd={step}
        onDone={(route) => {
          step('done');
          setScreen({ step: 'date', route });
        }}
      />
    );
  if (screen.step === 'date') {
    const { route } = screen;
    return (
      <DateStep
        now={now}
        onBack={() => setScreen({ step: 'route', route })}
        onDone={(date) => setScreen({ step: 'results', route, date })}
      />
    );
  }
  const { route, date, open, booking } = screen;
  const results = () => setScreen({ step: 'results', route, date });
  return (
    <PlacesGate>
      {open && booking ? (
        <BookFlow
          trip={open}
          onBack={() => setScreen({ step: 'results', route, date, open })}
          onClose={results}
        />
      ) : open ? (
        <TripScreen
          trip={open}
          onBack={results}
          onBook={() => setScreen({ step: 'results', route, date, open, booking: true })}
        />
      ) : (
        <TripResults
          route={route}
          filters={filters}
          onFilters={setFilters}
          date={date}
          now={now}
          onBack={() => setScreen({ step: 'date', route })}
          onOpen={(trip) => setScreen({ step: 'results', route, date, open: trip })}
        />
      )}
    </PlacesGate>
  );
}
