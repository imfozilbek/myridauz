import { PICKUP_MODES, type Pitak, type PickupMode } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { ChoiceStep } from '../driver/steps/choice-step';
import { PitakMap } from '../map/pitak-map';
import type { Route } from '../places/route-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { regionOf } from '../way/way-end';

type Props = {
  readonly route: Route;
  // Back from the next step, the way chosen before (docs/94 F8).
  readonly selected?: PickupMode;
  // A return or the last trip again (G63): the way of the trip it repeats, kept with no question
  // where the direction has a pitak.
  readonly kept?: PickupMode;
  readonly onBack: () => void;
  readonly onDone: (mode: PickupMode) => void;
  // No pitak on the direction: only «around the city», the step is not shown (G40, docs/106 K2).
  readonly onSkip: () => void;
};

// How the driver picks people up (docs/70). The driver never chooses the pitak: the system takes
// the one of the direction; a direction without a pitak has only «around the city». The pitak is
// on a small map above the choices: the driver sees where they will wait (G26, docs/74).
export function TripModeStep({ route, selected, kept, onBack, onDone, onSkip }: Props) {
  const { t } = useI18n();
  const { map } = useApiClients();
  const [pitak, setPitak] = useState<Pitak | null | undefined>(undefined);
  useEffect(() => {
    map.pitakOf(regionOf(route.from), regionOf(route.to)).then(setPitak, () => setPitak(null));
  }, [map, route]);
  useEffect(() => {
    if (pitak === null) onSkip();
    else if (pitak && kept) onDone(kept);
  }, [pitak]);
  if (!pitak || kept) return <ScreenSkeleton onBack={onBack} />;
  const choices = PICKUP_MODES.map((mode) => ({
    value: mode,
    label: t(`way.trip.mode.${mode}`),
    ...(mode !== 'door' ? { subtitle: pitak.name } : {}),
  }));
  return (
    <ChoiceStep
      screen="market.mode"
      icon="origin"
      title={t('way.trip.mode.title')}
      choices={choices}
      lead={<PitakMap pitak={pitak} />}
      {...(selected ? { selected } : {})}
      onBack={onBack}
      onDone={onDone}
    />
  );
}
