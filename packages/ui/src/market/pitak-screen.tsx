import type { Pitak } from '@platform/contracts';
import { StepLayout } from '../account/step-layout';
import { useScreenView } from '../context/analytics-context';
import { PitakMap } from '../map/pitak-map';
import { Screen } from '../screen/screen';

type Props = { readonly pitak: Pitak; readonly hint: string; readonly onBack: () => void };

// «Xaritada ›» of the pitak of a new trip (G63, mockup g63/2, docs/126): where the driver waits, on
// the small map of the app; «Назад» comes back to the trip.
export function PitakScreen({ pitak, hint, onBack }: Props) {
  useScreenView('market.pitak');
  return (
    <StepLayout icon="pitak" title={pitak.name} hint={hint}>
      <Screen onBack={onBack} />
      <PitakMap pitak={pitak} />
    </StepLayout>
  );
}
