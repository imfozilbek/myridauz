import { REQUEST_MAX_SEATS, type Trip } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { haptic } from '../telegram/feedback';

// The filters live in the flow: they stay after a trip is opened and closed (docs/90 F-P1).
// seats: how many people go, a trip with fewer free seats is not shown (G41, docs/90 F-P4);
// woman: «Mashinada ayol bor» (docs/06); car: «Boʻsh salon», a trip that sells the whole car and has
// nobody yet (owner decision 06.10.2026, docs/118).
export type TripFilters = { readonly seats: number; readonly woman: boolean; readonly car: boolean };
export const NO_FILTERS: TripFilters = { seats: 1, woman: false, car: false };

const PEOPLE = Array.from({ length: REQUEST_MAX_SEATS }, (_, index) => index + 1);

export const freeCar = (trip: Trip) => trip.bookingRule !== 'seats' && trip.seatsLeft === trip.seats;
// What the phone filters itself; «Mashinada ayol bor» is asked from the server (docs/06).
export const fitsFilters = (trip: Trip, filters: TripFilters) =>
  trip.seatsLeft >= filters.seats && (!filters.car || freeCar(trip));

type Props = { readonly filters: TripFilters; readonly onFilters: (filters: TripFilters) => void };

// The filters above the trips (journey of path 2, screen 5): one tap each, never typing (docs/19).
export function TripFiltersRow({ filters, onFilters }: Props) {
  const { t } = useI18n();
  const set = (next: Partial<TripFilters>) => {
    haptic.select();
    onFilters({ ...filters, ...next });
  };
  return (
    <div className="find-filters">
      <div className="find-people">
        <span className="find-people-ask">{t('find.people')}</span>
        {PEOPLE.map((count) => (
          <button
            key={count}
            type="button"
            className="find-pill find-round"
            aria-pressed={filters.seats === count}
            onClick={() => set({ seats: count })}
          >
            {count}
          </button>
        ))}
      </div>
      <div className="find-marks">
        <button
          type="button"
          className="find-pill"
          aria-pressed={filters.woman}
          onClick={() => set({ woman: !filters.woman })}
        >
          <Icon name="female" size={15} />
          {t('market.search.woman')}
        </button>
        <button
          type="button"
          className="find-pill"
          aria-pressed={filters.car}
          onClick={() => set({ car: !filters.car })}
        >
          {t('find.freeCar')}
        </button>
      </div>
    </div>
  );
}
