import type { Trip } from '@platform/contracts';
import { Title } from '@telegram-apps/telegram-ui';
import { useMemo } from 'react';
import { Cell, List, Section, Switch } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import type { Route } from '../places/route-screen';
import { EmptyState } from '../states/empty-state';
import { NotifyMe } from '../subscriptions/notify-me';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { useKeepPlace } from '../screen/keep-place';
import { useListPlace } from '../screen/list-memory';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { useScreenBackground } from '../telegram/screen-background';
import { DayChips } from './day-chips';
import { FilteredEmpty } from './filtered-empty';
import { RouteView } from './route-view';
import { TripCard } from './trip-card';
import { RESULTS, useTripSearch } from './use-trip-search';
import { useDayLabel } from './when';
import './market.css';

// The filters live in the flow: they stay after a trip is opened and closed (docs/90 F-P1).
export type TripFilters = { readonly woman: boolean; readonly door: boolean };

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
  const dayLabel = useDayLabel();
  // «Uyimdan olib ketsin» is a filter of the phone, the list is already here (docs/88 L5).
  const { woman, door } = filters;
  const { trips, failed, load, refresh } = useTripSearch(route, date, woman);
  const shown = useMemo(
    () => (door ? trips?.filter((trip) => trip.pickupMode !== 'pitak') : trips),
    [trips, door],
  );
  // «Назад» from a trip: the same place; a quiet refresh keeps the trip under the finger (docs/94).
  useListPlace(RESULTS, trips !== null);
  useKeepPlace(shown);
  if (failed) return <ErrorScreen onRetry={load} onBack={onBack} />;
  return (
    <div className="market">
      <Screen onBack={onBack} onRefresh={refresh} />
      <Title weight="1" className="market-title">
        {dayLabel(date, now)}
      </Title>
      <DayChips date={date} now={now} onDay={onDay} onOther={onOtherDay} />
      <List>
        <Section>
          <div className="route-summary">
            <RouteView from={route.from.id} to={route.to.id} />
          </div>
          <Cell
            Component="label"
            after={
              <Switch
                checked={woman}
                onChange={(event) => onFilters({ ...filters, woman: event.target.checked })}
              />
            }
          >
            {t('market.search.woman')}
          </Cell>
          <Cell
            Component="label"
            after={
              <Switch
                checked={door}
                onChange={(event) => onFilters({ ...filters, door: event.target.checked })}
              />
            }
          >
            {t('market.search.door')}
          </Cell>
        </Section>
        {shown?.map((trip) => (
          <div key={trip.id} data-row={trip.id}>
            <TripCard trip={trip} onOpen={() => onOpen(trip)} />
          </div>
        ))}
      </List>
      {trips === null ? <ScreenSkeleton /> : null}
      {trips && shown?.length === 0 ? (
        <FilteredEmpty
          route={route}
          date={date}
          filters={filters}
          found={trips}
          onClear={() => onFilters({ woman: false, door: false })}
        >
          <EmptyState
            icon="search"
            title={t('market.search.empty')}
            description={t('market.search.emptyHint')}
            action={<NotifyMe from={route.from.id} to={route.to.id} date={date} woman={woman} />}
          />
        </FilteredEmpty>
      ) : null}
      {trips?.length === 0 ? (
        <MainButton text={t('common.passenger.leaveRequest')} onClick={onRequest} />
      ) : null}
    </div>
  );
}
