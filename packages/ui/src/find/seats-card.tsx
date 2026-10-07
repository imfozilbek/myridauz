import type { Trip } from '@platform/contracts';
import { useAccount } from '../account/account-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { Switch } from '../switch';
import { haptic } from '../telegram/feedback';
import { offersWoman, type SeatChoice } from './seat-choice';

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
            <span className="seats-stepper">
              <button
                type="button"
                aria-label={t('market.price.less')}
                disabled={choice.seats <= 1}
                onClick={() => step(-1)}
              >
                <Icon name="less" size={20} />
              </button>
              <span className="seats-count">{choice.seats}</span>
              <button
                type="button"
                aria-label={t('market.price.more')}
                disabled={choice.seats >= trip.seatsLeft}
                onClick={() => step(1)}
              >
                <Icon name="more" size={20} />
              </button>
            </span>
          </div>
        )}
        {offersWoman(trip, choice, isMan) ? (
          <label className="seats-row seats-woman">
            <span className="seats-woman-text">
              <span>{t('find.withWoman')}</span>
              <span className="seats-woman-hint">{t('find.withWomanHint')}</span>
            </span>
            <Switch
              checked={choice.withWoman}
              onChange={(event) => set({ withWoman: event.target.checked })}
            />
          </label>
        ) : null}
        <div className="seats-row seats-total">
          <span>{t('find.total', { price: formatNumber(trip.price), seats: String(choice.seats) })}</span>
          <span className="seats-sum">{formatMoney(trip.price * choice.seats)}</span>
        </div>
      </div>
    </>
  );
}
