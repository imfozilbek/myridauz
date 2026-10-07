import type { Trip } from '@platform/contracts';
import { useAccount } from '../account/account-context';
import { useI18n } from '../context/i18n-context';
import { haptic } from '../telegram/feedback';
import { offersWoman, type SeatChoice } from './seat-choice';
import { Stepper } from './stepper';
import { ToggleRow } from './toggle-row';

type Props = {
  readonly trip: Trip;
  readonly choice: SeatChoice;
  readonly onChoice: (choice: SeatChoice) => void;
};

// «Necha kishi ketadi?» (docs/118 path 2, journey screen 6): the seats up to the free ones of the trip
// (docs/128 §2), the whole car where the driver sells it (docs/09), «Men bilan ayol bor» (docs/06) and
// «Jami»: the seats × the price of a seat.
export function SeatsCard({ trip, choice, onChoice }: Props) {
  const { t, formatMoney, formatNumber } = useI18n();
  const isMan = useAccount()?.profile.gender === 'male';
  const set = (next: Partial<SeatChoice>) => {
    haptic.select();
    const merged = { ...choice, ...next };
    onChoice({ ...merged, withWoman: merged.withWoman && offersWoman(trip, merged, isMan) });
  };
  const step = (by: number) => set({ seats: Math.min(trip.seatsLeft, Math.max(1, choice.seats + by)) });
  return (
    <>
      {trip.bookingRule === 'seats_or_car' ? (
        <div className="seats-mode" role="tablist">
          {[false, true].map((whole) => (
            <button
              key={String(whole)}
              type="button"
              role="tab"
              aria-selected={choice.wholeCar === whole}
              onClick={() =>
                set(whole ? { wholeCar: true, seats: trip.seats } : { wholeCar: false, seats: 1 })
              }
            >
              {t(whole ? 'find.wholeCar' : 'find.seatsMode')}
            </button>
          ))}
        </div>
      ) : null}
      <div className="safar-card seats-card">
        {choice.wholeCar ? (
          <div className="seats-row">
            <span>{t(trip.bookingRule === 'car_only' ? 'find.carOnly' : 'find.wholeCar')}</span>
            <span className="seats-count">{t('find.carSeats', { count: String(trip.seats) })}</span>
          </div>
        ) : (
          <div className="seats-row">
            <span>{t('find.seats')}</span>
            <Stepper
              value={choice.seats}
              atLeast={choice.seats <= 1}
              atMost={choice.seats >= trip.seatsLeft}
              onStep={step}
            />
          </div>
        )}
        {offersWoman(trip, choice, isMan) ? (
          <ToggleRow
            label={t('find.withWoman')}
            hint={t('find.withWomanHint')}
            checked={choice.withWoman}
            onChange={(withWoman) => set({ withWoman })}
          />
        ) : null}
        <div className="seats-row seats-total">
          <span>{t('find.total', { price: formatNumber(trip.price), seats: String(choice.seats) })}</span>
          <span className="seats-sum">{formatMoney(trip.price * choice.seats)}</span>
        </div>
      </div>
    </>
  );
}
