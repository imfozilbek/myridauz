import { REQUEST_MAX_SEATS, type Recommendation } from '@platform/contracts';
import { useAccount } from '../account/account-context';
import { useI18n } from '../context/i18n-context';
import { Stepper } from '../find/stepper';
import { ToggleRow } from '../find/toggle-row';
import { haptic } from '../telegram/feedback';
import '../find/seats.css';
import './request-points.css';

export type RequestChoiceValue = {
  readonly seats: number;
  readonly price: number;
  readonly withWoman: boolean;
  readonly wholeCar: boolean;
};
type Props = {
  readonly value: RequestChoiceValue;
  readonly recommendation: Recommendation;
  readonly onChange: (value: RequestChoiceValue) => void;
};

// «Men bilan ayol bor» is a man's with 2 people and more (docs/06 rule 4); a woman gives the mark herself.
const offersWoman = (isMan: boolean, seats: number) => isMan && seats >= 2;

// «Hammasi» of a request (G61, mockup 1-request): the people, the share of one seat by the steps of
// the route within the bounds (docs/09), «Men bilan ayol bor», «Boʻsh salon kerak» and the sum.
export function RequestChoice({ value, recommendation, onChange }: Props) {
  const { t, formatMoney, formatNumber } = useI18n();
  const isMan = useAccount()?.profile.gender === 'male';
  const { minPrice, maxPrice, roundStep } = recommendation;
  const set = (change: Partial<RequestChoiceValue>) => {
    haptic.select();
    const next = { ...value, ...change };
    onChange({ ...next, withWoman: next.withWoman && offersWoman(isMan, next.seats) });
  };
  return (
    <div className="points-card seats-card">
      <div className="seats-row">
        <span>{t('market.request.people')}</span>
        <Stepper
          value={value.seats}
          atLeast={value.seats <= 1}
          atMost={value.seats >= REQUEST_MAX_SEATS}
          onStep={(by) => set({ seats: value.seats + by })}
        />
      </div>
      <div className="seats-row">
        <span className="seats-text">
          <span>{t('market.price.title')}</span>
          <span className="seats-hint">
            {t('market.trip.recommendedShort', { price: formatNumber(recommendation.price) })}
          </span>
        </span>
        <Stepper
          value={formatNumber(value.price)}
          atLeast={value.price - roundStep < minPrice}
          atMost={value.price + roundStep > maxPrice}
          onStep={(by) => set({ price: value.price + by * roundStep })}
        />
      </div>
      {offersWoman(isMan, value.seats) ? (
        <ToggleRow
          label={t('find.withWoman')}
          hint={t('find.withWomanHint')}
          checked={value.withWoman}
          onChange={(withWoman) => set({ withWoman })}
        />
      ) : null}
      <ToggleRow
        label={t('market.request.wholeCar')}
        hint={t('market.request.wholeCarHint')}
        checked={value.wholeCar}
        onChange={(wholeCar) => set({ wholeCar })}
      />
      <div className="seats-row request-total">
        <span>
          {t('bookings.points.line', { seats: String(value.seats), price: formatNumber(value.price) })}
        </span>
        <b>{formatMoney(value.price * value.seats)}</b>
      </div>
    </div>
  );
}
