import type { Trip } from '@platform/contracts';
import { Button } from '@telegram-apps/telegram-ui';
import { useEffect, useState, type ReactNode } from 'react';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import type { Route } from '../places/route-screen';
import { EmptyState } from '../states/empty-state';
import type { TripFilters } from './trip-filters';

type Props = {
  readonly route: Route;
  readonly date: string;
  readonly filters: TripFilters;
  // The trips the server found with «Mashinada ayol bor»; «Uyimdan» hid all of them.
  readonly found: readonly Trip[];
  readonly onClear: () => void;
  // The empty screen when no filter hid anything.
  readonly children: ReactNode;
};

// An empty list because of a filter is no «nothing found» (docs/89 P6): how many trips the filters
// hid, and one tap to turn them off.
export function FilteredEmpty({ route, date, filters, found, onClear, children }: Props) {
  const { t } = useI18n();
  const { market } = useApiClients();
  // «Uyimdan» and the number of people are counted on the phone at once; «ayol bor» asks the server. Until it answers nothing is
  // shown, so «nothing found» never flashes before «N trips are hidden» (G41, docs/108).
  const counted = filters.woman
    ? null
    : filters.door || filters.seats > 1 || filters.dayPart !== 'any'
      ? found.length
      : 0;
  const [asked, setAsked] = useState<number | null>(null);
  useEffect(() => {
    if (!filters.woman) return undefined;
    let live = true;
    setAsked(null);
    market.searchTrips({ from: route.from.id, to: route.to.id, date }).then(
      (all) => live && setAsked(all.length),
      () => live && setAsked(0),
    );
    return () => void (live = false);
  }, [market, route, date, filters.woman]);
  const hidden = counted ?? asked;
  if (hidden === null) return null;
  if (hidden === 0) return <>{children}</>;
  return (
    <EmptyState
      icon="search"
      title={t('market.search.filtered', { count: String(hidden) })}
      action={
        <Button size="m" mode="bezeled" onClick={onClear}>
          {t('market.search.clearFilters')}
        </Button>
      }
    />
  );
}
