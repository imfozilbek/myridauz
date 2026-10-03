import { REQUEST_MAX_SEATS } from '@platform/contracts';
import { Cell, SegmentedControl, Section, Switch } from '../components';
import { useI18n } from '../context/i18n-context';
import { haptic } from '../telegram/feedback';

// The filters live in the flow: they stay after a trip is opened and closed (docs/90 F-P1).
// seats: how many people go; a trip with fewer free seats is not shown (G41, docs/90 F-P4).
export type TripFilters = { readonly woman: boolean; readonly door: boolean; readonly seats: number };
export const NO_FILTERS: TripFilters = { woman: false, door: false, seats: 1 };

const PEOPLE = Array.from({ length: REQUEST_MAX_SEATS }, (_, index) => index + 1);

type Props = { readonly filters: TripFilters; readonly onFilters: (filters: TripFilters) => void };

// The filters above the trips: a choice by one tap, never typing (docs/19).
export function TripFiltersSection({ filters, onFilters }: Props) {
  const { t } = useI18n();
  const toggle = (name: 'woman' | 'door') => (
    <Switch
      checked={filters[name]}
      onChange={(event) => onFilters({ ...filters, [name]: event.target.checked })}
    />
  );
  return (
    <Section header={t('market.requestSeats.title')}>
      <div className="day-chips">
        <SegmentedControl>
          {PEOPLE.map((count) => (
            <SegmentedControl.Item
              key={count}
              className="day-chip"
              selected={filters.seats === count}
              aria-selected={filters.seats === count}
              onClick={() => {
                haptic.select();
                onFilters({ ...filters, seats: count });
              }}
            >
              {t('market.request.seats', { count: String(count) })}
            </SegmentedControl.Item>
          ))}
        </SegmentedControl>
      </div>
      <Cell Component="label" after={toggle('woman')}>
        {t('market.search.woman')}
      </Cell>
      <Cell Component="label" after={toggle('door')}>
        {t('market.search.door')}
      </Cell>
    </Section>
  );
}
