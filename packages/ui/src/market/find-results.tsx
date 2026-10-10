import { BookFlow } from '../bookings/book-flow';
import { useI18n } from '../context/i18n-context';
import { firstDay, useTripDays } from '../find/use-trip-days';
import { TripResults } from '../find/trip-results';
import { SafarScreen } from '../find/safar-screen';
import { PlacePicker } from '../places/place-picker';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import type { FindScreen } from './find-trip-flow';
import { PlacesGate, usePlaces } from './places-gate';
import type { TripFilters } from './trip-filters';
import { today } from './when';

type ResultsProps = {
  readonly screen: Extract<FindScreen, { step: 'results' }>;
  readonly now: number;
  readonly filters: TripFilters;
  readonly onFilters: (filters: TripFilters) => void;
  readonly onBack: () => void;
  // «Bosh sahifa» of a sent request (docs/118 path 2, C).
  readonly onHome: () => void;
  readonly onScreen: (screen: FindScreen) => void;
};

// The trips of one day of the search (G59): a trip, its booking, a district of the region, or a request.
export function FindResults(props: ResultsProps) {
  return (
    <PlacesGate onBack={props.onBack}>
      <Results key={`${props.screen.route.from.id}:${props.screen.route.to.id}`} {...props} />
    </PlacesGate>
  );
}

function Results({ screen, now, filters, onFilters, onBack, onHome, onScreen }: ResultsProps) {
  const { t } = useI18n();
  const directory = usePlaces();
  const { route, open, booking, district } = screen;
  const { value: days, failed, reload } = useTripDays(route);
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!days) return <ScreenSkeleton onBack={onBack} />;
  const date = screen.date ?? firstDay(days) ?? today(now);
  const results = () => onScreen({ step: 'results', route, date });
  if (district)
    return (
      <PlacePicker
        title={t('places.toTitle')}
        directory={directory}
        allowWholeRegion
        region={route.to}
        trips={{ total: days.days.reduce((sum, day) => sum + day.trips, 0), places: days.places }}
        onBack={results}
        onPick={(to) => onScreen({ step: 'results', route: { from: route.from, to } })}
      />
    );
  if (open && booking)
    return (
      <BookFlow
        trip={open}
        choice={booking}
        onBack={() => onScreen({ step: 'results', route, date, open })}
        onClose={results}
        onHome={onHome}
      />
    );
  if (open)
    return (
      <SafarScreen
        trip={open}
        onBack={results}
        onOthers={results}
        onBook={(choice) => onScreen({ step: 'results', route, date, open, booking: choice })}
      />
    );
  return (
    <TripResults
      route={route}
      days={days}
      date={date}
      filters={filters}
      onFilters={onFilters}
      onBack={onBack}
      onDay={(next) => onScreen({ step: 'results', route, date: next })}
      onRequest={() => onScreen({ step: 'request', route, date })}
      onDistrict={() => onScreen({ step: 'results', route, date, district: true })}
      onOpen={(trip) => onScreen({ step: 'results', route, date, open: trip })}
    />
  );
}
