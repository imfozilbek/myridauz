import type { Trip } from '@platform/contracts';
import { Title } from '@telegram-apps/telegram-ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Cell, List, Section, Switch } from '../components';
import { useAnalytics, useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { useFeedChange } from '../feed/feed-context';
import type { Route } from '../places/route-screen';
import { EmptyState } from '../states/empty-state';
import { NotifyMe } from '../subscriptions/notify-me';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { BackButton } from '../telegram/back-button';
import { useScreenBackground } from '../telegram/screen-background';
import { FilteredEmpty } from './filtered-empty';
import { RouteView } from './route-view';
import { TripCard } from './trip-card';
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
};

// Trips of the day on this route; "Mashinada ayol bor" is a filter of its own (docs/06).
export function TripResults({ route, filters, onFilters, date, now, onBack, onOpen }: TripResultsProps) {
  useScreenView('market.results');
  useScreenBackground('grouped');
  const { t } = useI18n();
  const { track } = useAnalytics();
  const { market } = useApiClients();
  const dayLabel = useDayLabel();
  // «Uyimdan olib ketsin» is a filter of the phone, the list is already here (docs/88 L5).
  const { woman, door } = filters;
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [failed, setFailed] = useState(false);
  const search = useMemo(
    () => ({
      from: route.from.id,
      to: route.to.id,
      date,
      ...(woman ? { woman: '1' as const } : {}),
    }),
    [route, date, woman],
  );
  const load = useCallback(() => {
    setFailed(false);
    setTrips(null);
    market.searchTrips(search).then(
      (found) => {
        track({
          name: 'trip_search',
          screen: 'market.results',
          result: found.length > 0 ? 'found' : 'empty',
        });
        setTrips(found);
      },
      () => setFailed(true),
    );
  }, [market, search, track]);
  useEffect(load, [load]);
  // Seats taken by others while the person looks: fresh results without the skeleton (docs/64).
  useFeedChange(() => void market.searchTrips(search).then(setTrips, () => undefined));
  const shown = door ? trips?.filter((trip) => trip.pickupMode !== 'pitak') : trips;
  if (failed) return <ErrorScreen onRetry={load} onBack={onBack} />;
  return (
    <div className="market">
      <BackButton onClick={onBack} />
      <Title weight="1" className="market-title">
        {dayLabel(date, now)}
      </Title>
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
          <TripCard key={trip.id} trip={trip} onOpen={() => onOpen(trip)} />
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
    </div>
  );
}
