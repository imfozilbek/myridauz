import { commissionFor } from '@platform/brands';
import type { Pitak, Recommendation } from '@platform/contracts';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Stepper } from '../find/stepper';
import { ToggleRow } from '../find/toggle-row';
import { haptic } from '../telegram/feedback';
import type { TripAnswer } from './new-trip-state';
import type { TripValues } from './trip-draft';
import { TripPickup } from './trip-pickup';
import { TripRow } from './trip-row';
import { RULE_LABELS } from './trip-rule-step';
import { useDayTimeLabel } from './when';
import '../find/seats.css';
import './trip-form.css';

export type TripPart = 'when' | 'rule' | 'comment' | 'pitak';
type Props = {
  readonly values: TripValues;
  readonly carSeats: number;
  readonly recommendation: Recommendation;
  readonly pitak: Pitak | null;
  readonly direction: string;
  readonly now: number;
  readonly onChange: (patch: TripAnswer) => void;
  readonly onOpen: (part: TripPart) => void;
};

// «Safar» of a new trip (G63, mockups g63/1, g63/2): the way of pickup, the day, the seats of the car
// with «Mashinada ayol bor» right under them, the price of a seat with its commission, the rule of
// the whole car and the comment. A row with a chevron opens its own screen and comes back here.
export function TripChoice(props: Props) {
  const { values, carSeats, recommendation, pitak, direction, now, onChange, onOpen } = props;
  const { t, formatNumber } = useI18n();
  const { commission } = useBrand();
  const dayTime = useDayTimeLabel();
  const { seats, price, comment } = values;
  const { minPrice, maxPrice, roundStep } = recommendation;
  const step = (patch: TripAnswer) => {
    haptic.select();
    onChange(patch);
  };
  return (
    <div className="points-card seats-card">
      <TripPickup
        mode={values.pickupMode}
        pitak={pitak}
        direction={direction}
        onMode={(pickupMode) => onChange({ pickupMode })}
        onMap={() => onOpen('pitak')}
      />
      <TripRow
        icon="day"
        label={values.time ? dayTime(values.date, values.time, now) : t('market.when.title')}
        onOpen={() => onOpen('when')}
      />
      <TripRow
        icon="profile"
        label={t('market.review.seats')}
        hint={t('market.publish.carSeats', { count: String(carSeats) })}
        after={
          <Stepper
            value={seats}
            atLeast={seats <= 1}
            atMost={seats >= carSeats}
            // All the seats again: nobody else goes, the question about a woman is gone (docs/06).
            onStep={(by) =>
              step({ seats: seats + by, ...(seats + by >= carSeats ? { womanOnBoard: false } : {}) })
            }
          />
        }
      />
      {values.askWoman ? (
        <ToggleRow
          icon="female"
          label={t('market.search.woman')}
          hint={t('market.publish.womanHint')}
          checked={values.womanOnBoard}
          onChange={(womanOnBoard) => onChange({ womanOnBoard })}
        />
      ) : null}
      <TripRow
        icon="price"
        label={t('market.price.title')}
        hint={t('market.publish.price', {
          price: formatNumber(recommendation.price),
          commission: formatNumber(commissionFor(commission, price, 1)),
        })}
        after={
          <Stepper
            value={formatNumber(price)}
            atLeast={price <= minPrice}
            atMost={price >= maxPrice}
            onStep={(by) => step({ price: Math.min(maxPrice, Math.max(minPrice, price + by * roundStep)) })}
          />
        }
      />
      <TripRow
        icon="car"
        label={t('market.rule.title')}
        hint={t('market.publish.rule', {
          rule: t(`market.rule.${RULE_LABELS[values.bookingRule]}`),
          sum: formatNumber(seats * price),
        })}
        onOpen={() => onOpen('rule')}
      />
      <TripRow
        icon="chat"
        label={t(comment ? 'market.comment.title' : 'market.publish.comment')}
        {...(comment ? { hint: comment } : {})}
        muted={!comment}
        onOpen={() => onOpen('comment')}
      />
    </div>
  );
}
