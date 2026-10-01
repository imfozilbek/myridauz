import { PICKUP_MODES, type Pitak, type PickupMode } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { ChoiceStep } from '../driver/steps/choice-step';
import { PitakMap } from '../map/pitak-map';
import type { Route } from '../places/route-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';

type Props = {
  readonly route: Route;
  readonly onBack: () => void;
  readonly onDone: (mode: PickupMode) => void;
};

// How the driver picks people up (docs/70). The driver never chooses the pitak: the system takes
// the one of the direction; a direction without a pitak has only «around the city». The pitak is
// on a small map above the choices: the driver sees where they will wait (G26, docs/74).
export function TripModeStep({ route, onBack, onDone }: Props) {
  const { t } = useI18n();
  const { map } = useApiClients();
  const [pitak, setPitak] = useState<Pitak | null | undefined>(undefined);
  useEffect(() => {
    const regionOf = (place: Route['from']) => place.parentId ?? place.id;
    map.pitakOf(regionOf(route.from), regionOf(route.to)).then(setPitak, () => setPitak(null));
  }, [map, route]);
  if (pitak === undefined) return <ScreenSkeleton onBack={onBack} />;
  const modes = PICKUP_MODES.filter((mode) => mode === 'door' || pitak !== null);
  const choices = modes.map((mode) => ({
    value: mode,
    label: t(`way.trip.mode.${mode}`),
    ...(mode !== 'door' && pitak ? { after: pitak.name } : {}),
  }));
  return (
    <ChoiceStep
      screen="market.mode"
      icon="origin"
      title={t('way.trip.mode.title')}
      choices={choices}
      {...(pitak ? { lead: <PitakMap pitak={pitak} /> } : {})}
      onBack={onBack}
      onDone={onDone}
    />
  );
}
