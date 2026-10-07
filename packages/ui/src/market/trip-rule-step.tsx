import { BOOKING_RULES, type BookingRule } from '@platform/contracts';
import { Text } from '@telegram-apps/telegram-ui';
import { useI18n } from '../context/i18n-context';
import { ChoiceStep } from '../driver/steps/choice-step';

type Props = {
  readonly seats: number;
  readonly price: number;
  readonly selected?: BookingRule;
  readonly onBack: () => void;
  readonly onDone: (rule: BookingRule) => void;
};

export const RULE_LABELS = { seats: 'seats', seats_or_car: 'seatsOrCar', car_only: 'carOnly' } as const;

// «Qanday band qilinadi?» (G61, docs/09, docs/118, mockup 2-whole-car screen 1): seats only, seats
// or the whole car, only the whole car. The price is always per seat: the whole car is the seats ×
// the price of a seat, never a price of its own (risk Р6, docs/30).
export function TripRuleStep({ seats, price, selected, onBack, onDone }: Props) {
  const { t, formatMoney, formatNumber } = useI18n();
  const count = String(seats);
  const choices = BOOKING_RULES.map((rule) => ({
    value: rule,
    label: t(`market.rule.${RULE_LABELS[rule]}`),
    subtitle: t(`market.rule.${RULE_LABELS[rule]}Hint`, { count }),
  }));
  return (
    <ChoiceStep
      screen="market.rule"
      icon="passengers"
      title={t('market.rule.title')}
      choices={choices}
      selected={selected ?? 'seats'}
      lead={
        <Text className="section-hint">
          {t('market.rule.price', { count, price: formatNumber(price), sum: formatMoney(seats * price) })}
        </Text>
      }
      onBack={onBack}
      onDone={onDone}
    />
  );
}
