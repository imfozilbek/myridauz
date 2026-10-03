import type { PickupMode, Pitak } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { ChoiceStep } from '../driver/steps/choice-step';
import { IconTile } from '../icon-tile';

const MODES = [
  { value: 'door', icon: 'door' },
  { value: 'pitak', icon: 'pitak' },
  { value: 'both', icon: 'anyWay' },
] as const;

type Props = {
  readonly pitak: Pitak;
  readonly selected: PickupMode | undefined;
  readonly onBack: () => void;
  readonly onDone: (mode: PickupMode) => void;
};

// Where a driver takes the passenger of a request: only on a direction with a pitak (docs/70, PS8).
export function RequestModeStep({ pitak, selected, onBack, onDone }: Props) {
  const { t } = useI18n();
  return (
    <ChoiceStep
      screen="market.request_mode"
      icon="origin"
      title={t('way.mode.title')}
      choices={MODES.map(({ value, icon }) => ({
        value,
        label: t(`way.mode.${value}`),
        before: <IconTile name={icon} />,
        ...(value === 'door' ? {} : { subtitle: pitak.name }),
      }))}
      {...(selected ? { selected } : {})}
      onBack={onBack}
      onDone={onDone}
    />
  );
}
