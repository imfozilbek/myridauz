import type { Trip } from '@platform/contracts';
import { Title } from '@telegram-apps/telegram-ui';
import { useMemo } from 'react';
import { List } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import type { Route } from '../places/route-screen';
import { EmptyState } from '../states/empty-state';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { useKeepPlace } from '../screen/keep-place';
import { useListPlace } from '../screen/list-memory';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { useScreenBackground } from '../telegram/screen-background';
import { DayChips } from './day-chips';
import { FilteredEmpty } from './filtered-empty';
import { TripCard } from './trip-card';
import { inDayPart } from './day-part';
import { NO_FILTERS, TripFiltersSection, type TripFilters } from './trip-filters';
import { RESULTS, useTripSearch } from './use-trip-search';
import './market.css';

type TripResultsProps = {
  readonly route: Route;
  readonly filters: TripFilters;
  readonly onFilters: (filters: TripFilters) => void;
  readonly date: string;
  readonly now: number;
  readonly onBack: () => void;
  readonly onOpen: (trip: Trip) => void;
  // The day changes here (G35, docs/97 K2); an empty day leads to a request (K6).
  readonly onDay: (date: string) => void;
  readonly onOtherDay: () => void;
  readonly onRequest: () => void;
};

// Trips of the day on this route; "Mashinada ayol bor" is a filter of its own (docs/06).
export function TripResults(props: TripResultsProps) {
  const { route, filters, onFilters, date, now, onBack, onOpen, onDay, onOtherDay, onRequest } = props;
  useScreenView('market.results');
  useScreenBackground('grouped');
  const { t } = useI18n();
  // «Uyimdan olib ketsin» is a filter of the phone, the list is already here (docs/88 L5).
  const { woman, door, seats, dayPart } = filters;
  const { trips, stale, failed, load, refresh } = useTripSearch(route, date, woman);
  const shown = useMemo(
    () =>
      trips?.filter(
        (trip) =>
          (!door || trip.pickupMode !== 'pitak') &&
          trip.seatsLeft >= seats &&
          inDayPart(dayPart, trip.departAt),
      ) ?? null,
    [trips, door, seats, dayPart],
  );
  // «Назад» from a trip: the same place; a quiet refresh keeps the trip under the finger (docs/94).
  useListPlace(RESULTS, trips !== null);
  useKeepPlace(shown);
  if (failed) return <ErrorScreen onRetry={load} onBack={onBack} />;
  return (
    <div className="market">
      <Screen onBack={onBack} onRefresh={refresh} />
      {/* The route is the title; the day is on its chip (G40, docs/106 C6). */}
      <Title weight="1" className="market-title">
        {t('common.route', { from: route.from.name, to: route.to.name })}
      </Title>
      <DayChips date={date} now={now} onDay={onDay} onOther={onOtherDay} />
      <List>
        <TripFiltersSection filters={filters} onFilters={onFilters} />
        {/* Another day loads: the cards stay and dim only when the wait is long (G41, docs/108). */}
        <div className={stale ? 'list-stale' : undefined}>
          {shown?.map((trip) => (
            <div key={trip.id} data-row={trip.id}>
              <TripCard trip={trip} onOpen={() => onOpen(trip)} />
            </div>
          ))}
        </div>
      </List>
      {trips === null ? <ScreenSkeleton /> : null}
      {trips && !stale && shown?.length === 0 ? (
        <FilteredEmpty
          route={route}
          date={date}
          filters={filters}
          found={trips}
          onClear={() => onFilters(NO_FILTERS)}
        >
          <EmptyState
            icon="search"
            title={t('market.search.empty')}
            description={t('market.search.emptyHint')}
          />
        </FilteredEmpty>
      ) : null}
      {trips?.length === 0 ? (
        <MainButton text={t('common.passenger.leaveRequest')} onClick={onRequest} />
      ) : null}
    </div>
  );
}
