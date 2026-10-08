import { BOOKING_RULES, type BookingRule } from '@platform/contracts';
import { useState } from 'react';
import { StepLayout } from '../account/step-layout';
import { Radio } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { brandVars } from '../theme/brand-vars';
import './trip-rule-step.css';

type Props = {
  readonly model: string;
  readonly seats: number;
  readonly price: number;
  readonly selected?: BookingRule;
  readonly onBack: () => void;
  readonly onDone: (rule: BookingRule) => void;
};

export const RULE_LABELS = { seats: 'seats', seats_or_car: 'seatsOrCar', car_only: 'carOnly' } as const;

// «Qanday band qilinadi?» (G61, docs/09, docs/118, mockup 2-whole-car screen 1): seats only, seats
// or the whole car, only the whole car, as cards with a radio. The price is always per seat: the
// whole car is the seats × the price of a seat, never a price of its own (risk Р6, docs/30).
export function TripRuleStep({ model, seats, price, selected, onBack, onDone }: Props) {
  useScreenView('market.rule');
  const { t, formatMoney, formatNumber } = useI18n();
  const { colors } = useBrand().theme;
  const [rule, setRule] = useState<BookingRule>(selected ?? 'seats');
  const count = String(seats);
  const choose = (next: BookingRule) => {
    haptic.select();
    setRule(next);
  };
  return (
    <div className="rule-screen" style={brandVars(colors)}>
      <StepLayout
        title={t('market.rule.title')}
        hint={t('market.rule.sub', { model, count, price: formatMoney(price) })}
      >
        <Screen onBack={onBack} />
        <div className="rule-step" role="radiogroup">
          {BOOKING_RULES.map((value) => (
            <div
              key={value}
              className={value === rule ? 'rule-card rule-card-on' : 'rule-card'}
              onClick={() => choose(value)}
            >
              <Radio name="rule" value={value} checked={value === rule} onChange={() => choose(value)} />
              <div className="rule-text">
                <span className="rule-label">{t(`market.rule.${RULE_LABELS[value]}`)}</span>
                <span className="rule-hint">{t(`market.rule.${RULE_LABELS[value]}Hint`, { count })}</span>
              </div>
            </div>
          ))}
          <p className="rule-price">
            {t('market.rule.price', { count, price: formatNumber(price), sum: formatNumber(seats * price) })}
          </p>
        </div>
        <MainButton text={t('common.continue')} onClick={() => onDone(rule)} />
      </StepLayout>
    </div>
  );
}
