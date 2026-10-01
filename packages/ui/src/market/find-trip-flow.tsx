import type { Trip } from '@platform/contracts';
import { useState } from 'react';
import { BookFlow } from '../bookings/book-flow';
import type { Route } from '../places/route-screen';
import { WayScreen } from '../way/way-screen';
import type { Way } from '../way/way-end';
import { DateStep } from './date-step';
import { PlacesGate } from './places-gate';
import { TripResults } from './trip-results';
import { TripScreen } from './trip-screen';

type Screen =
  | { readonly step: 'route' }
  | { readonly step: 'date'; readonly route: Route; readonly way?: Way }
  | {
      readonly step: 'results';
      readonly route: Route;
      readonly way?: Way;
      readonly date: string;
      readonly open?: Trip;
      readonly booking?: boolean;
    };

type Props = { readonly onBack: () => void; readonly initial?: Route | undefined };

// A passenger looks for a trip: the start and the end over the map (docs/71), a day, the list
// with the trips that suit first (docs/70). A link of the landing brings the districts (docs/59).
const routeOf = (way: Way): Route => ({ from: way.from.place, to: way.to.place });

export function FindTripFlow({ onBack, initial }: Props) {
  const [screen, setScreen] = useState<Screen>(
    initial ? { step: 'date', route: initial } : { step: 'route' },
  );
  const [now] = useState(Date.now);
  if (screen.step === 'route')
    return (
      <WayScreen
        done="way.see"
        onBack={onBack}
        onDone={(way) => setScreen({ step: 'date', route: routeOf(way), way })}
      />
    );
  if (screen.step === 'date') {
    const { route, way } = screen;
    return (
      <DateStep
        now={now}
        onBack={() => setScreen({ step: 'route' })}
        onDone={(date) => setScreen({ step: 'results', route, date, ...(way ? { way } : {}) })}
      />
    );
  }
  const { route, date, open, booking, way } = screen;
  const kept = way ? { way } : {};
  const results = () => setScreen({ step: 'results', route, date, ...kept });
  return (
    <PlacesGate>
      {open && booking ? (
        <BookFlow
          trip={open}
          way={way ?? null}
          onBack={() => setScreen({ step: 'results', route, date, open, ...kept })}
          onClose={results}
        />
      ) : open ? (
        <TripScreen
          trip={open}
          onBack={results}
          onBook={() => setScreen({ step: 'results', route, date, open, booking: true, ...kept })}
        />
      ) : (
        <TripResults
          route={route}
          way={way ?? null}
          date={date}
          now={now}
          onBack={() => setScreen({ step: 'date', route, ...kept })}
          onOpen={(trip) => setScreen({ step: 'results', route, date, open: trip, ...kept })}
        />
      )}
    </PlacesGate>
  );
}
