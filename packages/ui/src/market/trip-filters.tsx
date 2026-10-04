import { REQUEST_MAX_SEATS } from '@platform/contracts';
import { Cell, SegmentedControl, Section, Switch } from '../components';
import { useI18n } from '../context/i18n-context';
import { haptic } from '../telegram/feedback';
import { DAY_PARTS, type DayPart } from './day-part';

// The filters live in the flow: they stay after a trip is opened and closed (docs/90 F-P1).
// seats: how many people go; a trip with fewer free seats is not shown (G41, docs/90 F-P4).
// dayPart: morning, day or evening by Tashkent (G41, docs/90 F-P6).
export type TripFilters = {
  readonly woman: boolean;
  readonly door: boolean;
  readonly seats: number;
  readonly dayPart: DayPart;
};
export const NO_FILTERS: TripFilters = { woman: false, door: false, seats: 1, dayPart: 'any' };

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
  const choose =
    <K extends 'seats' | 'dayPart'>(name: K, value: TripFilters[K]) =>
    () => {
      haptic.select();
      onFilters({ ...filters, [name]: value });
    };
  const item = (key: string, selected: boolean, onClick: () => void, text: string) => (
    <SegmentedControl.Item
      key={key}
      className="day-chip"
      selected={selected}
      aria-selected={selected}
      onClick={onClick}
    >
      {text}
    </SegmentedControl.Item>
  );
  return (
    <Section header={t('market.requestSeats.title')}>
      <div className="day-chips">
        <SegmentedControl>
          {PEOPLE.map((count) =>
            item(
              String(count),
              filters.seats === count,
              choose('seats', count),
              t('market.request.seats', { count: String(count) }),
            ),
          )}
        </SegmentedControl>
      </div>
      <div className="day-chips">
        <SegmentedControl>
          {DAY_PARTS.map((part) =>
            item(part, filters.dayPart === part, choose('dayPart', part), t(`market.filter.dayPart.${part}`)),
          )}
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
