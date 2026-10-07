import type { Location, Trip, TripDays } from '@platform/contracts';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { FilteredEmpty } from '../market/filtered-empty';
import { fitsFilters, NO_FILTERS, TripFiltersRow, type TripFilters } from '../market/trip-filters';
import { RESULTS, useTripSearch } from '../market/use-trip-search';
import { usePlaces } from '../market/places-gate';
import { usePlaceNames } from '../places/place-names';
import type { Route } from '../places/route-screen';
import { useListPlace } from '../screen/list-memory';
import { Screen } from '../screen/screen';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';
import { DayCounts } from './day-counts';
import { HiddenTrips } from './hidden-trips';
import { LearnBlock } from './learn-block';
import { ResultsHead } from './results-head';
import { SearchTripCard } from './search-trip-card';
import './find.css';
import './results.css';
import './trip-card.css';

type Props = {
  readonly route: Route;
  readonly days: TripDays;
  readonly date: string;
  readonly filters: TripFilters;
  readonly onFilters: (filters: TripFilters) => void;
  readonly onBack: () => void;
  readonly onOpen: (trip: Trip) => void;
  readonly onDay: (date: string) => void;
  readonly onRequest: () => void;
  // A whole region: «Samarqandning qaysi joyi? Tuman tanlash» narrows it (docs/118 path 2).
  readonly onDistrict: () => void;
};

// «Safarlar» (docs/118 path 2, journey screen 5): the days of a week with their trips, the people and
// the marks, the trips, then the ways to know about new trips (docs/119).
export function TripResults(props: Props) {
  const { route, days, date, filters, onFilters, onBack, onOpen, onDay, onRequest, onDistrict } = props;
  useScreenView('market.results');
  useScreenBackground();
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const directory = usePlaces();
  const names = usePlaceNames(directory);
  const { trips, stale, failed, load, refresh } = useTripSearch(route, date, filters.woman);
  const shown = trips?.filter((trip) => fitsFilters(trip, filters)) ?? null;
  useListPlace(RESULTS, trips !== null);
  if (failed) return <ErrorScreen onRetry={load} onBack={onBack} />;
  const regionOf = (place: Location) =>
    place.parentId === null ? place : (directory.find(place.parentId) ?? place);
  const region = regionOf(route.to);
  // Nothing shown, and a filter may be why: how many it hid, or the empty day (docs/89 P6).
  const filtered = !stale && shown?.length === 0 && (trips?.length !== 0 || filters.woman);
  const learn = (empty: boolean) => (
    <LearnBlock
      route={route}
      region={region}
      date={date}
      directory={directory}
      empty={empty}
      onRequest={onRequest}
    />
  );
  return (
    <div className="find" style={brandVars(colors)}>
      <Screen onBack={onBack} onRefresh={refresh} />
      <ResultsHead route={route} from={regionOf(route.from)} region={region} km={days.km} />
      <DayCounts days={days.days} date={date} onDay={onDay} />
      <TripFiltersRow filters={filters} onFilters={onFilters} />
      <div className={stale ? 'search-trips list-stale' : 'search-trips'}>
        {shown?.map((trip) => (
          <div key={trip.id} data-row={trip.id}>
            <SearchTripCard trip={trip} onOpen={() => onOpen(trip)} />
          </div>
        ))}
      </div>
      {trips === null ? <ScreenSkeleton /> : null}
      {trips && !filtered ? <HiddenTrips trips={trips} filters={filters} /> : null}
      {route.to.parentId === null && !route.to.oneCity ? (
        <button type="button" className="results-district" onClick={onDistrict}>
          {t('find.district', { region: names.short(region) })}
        </button>
      ) : null}
      {trips === null ? null : filtered ? (
        <FilteredEmpty
          route={route}
          date={date}
          filters={filters}
          found={trips}
          onClear={() => onFilters(NO_FILTERS)}
        >
          {learn(true)}
        </FilteredEmpty>
      ) : (
        learn(trips.length === 0)
      )}
    </div>
  );
}
