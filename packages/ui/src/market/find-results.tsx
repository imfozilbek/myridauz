import { BookFlow } from '../bookings/book-flow';
import { ScreenSkeleton } from '../states/screen-skeleton';
import type { FindScreen } from './find-trip-flow';
import { useFirstDay } from './first-day';
import { PlacesGate } from './places-gate';
import type { TripFilters } from './trip-filters';
import { TripResults } from './trip-results';
import { TripScreen } from './trip-screen';

type ResultsProps = {
  readonly screen: Extract<FindScreen, { step: 'results' }>;
  readonly now: number;
  readonly filters: TripFilters;
  readonly onFilters: (filters: TripFilters) => void;
  readonly onBack: () => void;
  readonly onScreen: (screen: FindScreen) => void;
};

// The trips of one day of the search: a trip, its booking, or another day and a request (G35).
export function FindResults({ screen, now, filters, onFilters, onBack, onScreen }: ResultsProps) {
  const { route, open, booking } = screen;
  const date = useFirstDay(route, now, screen.date);
  if (!date) return <ScreenSkeleton onBack={onBack} />;
  const results = () => onScreen({ step: 'results', route, date });
  return (
    <PlacesGate onBack={onBack}>
      {open && booking ? (
        <BookFlow
          trip={open}
          onBack={() => onScreen({ step: 'results', route, date, open })}
          onClose={results}
        />
      ) : open ? (
        <TripScreen
          trip={open}
          onBack={results}
          onOthers={results}
          onBook={() => onScreen({ step: 'results', route, date, open, booking: true })}
        />
      ) : (
        <TripResults
          route={route}
          filters={filters}
          onFilters={onFilters}
          date={date}
          now={now}
          onBack={onBack}
          onDay={(next) => onScreen({ step: 'results', route, date: next })}
          onOtherDay={() => onScreen({ step: 'calendar', route, date })}
          onRequest={() => onScreen({ step: 'request', route, date })}
          onOpen={(trip) => onScreen({ step: 'results', route, date, open: trip })}
        />
      )}
    </PlacesGate>
  );
}
