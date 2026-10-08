import type { Trip } from '@platform/contracts';
import { StepLayout } from '../account/step-layout';
import { List } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { TripChangeCells, type TripChange } from '../market/trip-change';
import { Screen } from '../screen/screen';

type Props = {
  readonly trip: Trip;
  readonly onChange: (change: TripChange) => void;
  readonly onBack: () => void;
};

// «Vaqt yoki narx» (mockup g63/3): one tile, then the two changes of G39 (docs/104) to choose from.
export function ChangeChoice({ trip, onChange, onBack }: Props) {
  useScreenView('market.change');
  const { t } = useI18n();
  return (
    <StepLayout icon="edit" title={t('driverTrip.tile.change')}>
      <Screen onBack={onBack} />
      <List>
        <TripChangeCells trip={trip} onChange={onChange} />
      </List>
    </StepLayout>
  );
}
