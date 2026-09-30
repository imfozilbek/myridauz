import type { Trip } from '@platform/contracts';
import { useState } from 'react';
import { BookFlow } from '../bookings/book-flow';
import { RouteScreen, type Route } from '../places/route-screen';
import { DateStep } from './date-step';
import { PlacesGate } from './places-gate';
import { TripResults } from './trip-results';
import { TripScreen } from './trip-screen';

type Screen =
  | { readonly step: 'route' }
  | { readonly step: 'date'; readonly route: Route }
  | {
      readonly step: 'results';
      readonly route: Route;
      readonly date: string;
      readonly open?: Trip;
      readonly booking?: boolean;
    };

type Props = { readonly onBack: () => void; readonly initial?: Route | undefined };

// A passenger looks for a trip: route (a place or a whole region), a day, the list (docs/14).
// A link of the landing brings the route already chosen (docs/59).
export function FindTripFlow({ onBack, initial }: Props) {
  const [screen, setScreen] = useState<Screen>(
    initial ? { step: 'date', route: initial } : { step: 'route' },
  );
  const [now] = useState(Date.now);
  if (screen.step === 'route')
    return (
      <RouteScreen allowWholeRegion onBack={onBack} onDone={(route) => setScreen({ step: 'date', route })} />
    );
  if (screen.step === 'date') {
    const { route } = screen;
    return (
      <DateStep
        now={now}
        onBack={() => setScreen({ step: 'route' })}
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
          date={date}
          now={now}
          onBack={() => setScreen({ step: 'date', route })}
          onOpen={(trip) => setScreen({ step: 'results', route, date, open: trip })}
        />
      )}
    </PlacesGate>
  );
}
