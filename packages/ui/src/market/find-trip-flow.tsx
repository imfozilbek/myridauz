import type { Trip } from '@platform/contracts';
import { useState } from 'react';
import { RouteScreen, type Route } from '../places/route-screen';
import { DateStep } from './date-step';
import { PlacesGate } from './places-gate';
import { TripResults } from './trip-results';
import { TripScreen } from './trip-screen';

type Screen =
  | { readonly step: 'route' }
  | { readonly step: 'date'; readonly route: Route }
  | { readonly step: 'results'; readonly route: Route; readonly date: string; readonly open?: Trip };

// A passenger looks for a trip: route (a place or a whole region), a day, the list (docs/14).
export function FindTripFlow({ onBack }: { readonly onBack: () => void }) {
  const [screen, setScreen] = useState<Screen>({ step: 'route' });
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
  const { route, date, open } = screen;
  return (
    <PlacesGate>
      {open ? (
        <TripScreen trip={open} onBack={() => setScreen({ step: 'results', route, date })} />
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
