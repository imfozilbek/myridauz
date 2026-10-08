import { POPULAR_CARS, type CarInput } from '@platform/contracts';
import { ChoiceChip } from '../../chips/choice-chip';
import { useI18n } from '../../context/i18n-context';
import { haptic } from '../../telegram/feedback';
import { carLabel, type CarName } from '../car-choices';

type Props = {
  readonly car: Partial<CarInput>;
  readonly onPick: (car: CarName) => void;
  readonly onOther: () => void;
};

const same = (a: Partial<CarName>, b: CarName) => a.make === b.make && a.model === b.model;

// The model by one tap (mockup g62/1, screen 2): the popular cars, a car found in «Boshqa ›» joins
// them as the chosen one.
export function ModelChips({ car, onPick, onOther }: Props) {
  const { t } = useI18n();
  const { make, model } = car;
  const chosen = make && model ? { make, model } : null;
  const chips =
    chosen && !POPULAR_CARS.some((each) => same(each, chosen)) ? [...POPULAR_CARS, chosen] : POPULAR_CARS;
  return (
    <div className="car-chips">
      {chips.map((each) => (
        <ChoiceChip
          key={`${each.make} ${each.model}`}
          pressed={same(car, each)}
          onClick={() => {
            haptic.select();
            onPick(each);
          }}
        >
          {carLabel(each)}
        </ChoiceChip>
      ))}
      <ChoiceChip onClick={onOther}>{t('drivers.car.other')}</ChoiceChip>
    </div>
  );
}
