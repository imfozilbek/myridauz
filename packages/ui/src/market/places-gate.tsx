import { createContext, useContext, type ReactNode } from 'react';
import type { PlaceDirectory } from '../places/directory';
import { useDirectory } from '../places/use-directory';
import { useI18n } from '../context/i18n-context';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';

const PlacesContext = createContext<PlaceDirectory | null>(null);

// Trips and requests carry place ids; their names come from the directory, loaded once (docs/48).
// An inner screen passes its "back": the person is never locked in while places load (docs/65 B1).
export function PlacesGate({
  children,
  onBack,
}: {
  readonly children: ReactNode;
  readonly onBack?: () => void;
}) {
  const [state, retry] = useDirectory();
  const back = onBack ? { onBack } : {};
  if (state.status === 'loading') return <ScreenSkeleton {...back} />;
  if (state.status === 'error') return <ErrorScreen onRetry={retry} {...back} />;
  return <PlacesContext.Provider value={state.directory}>{children}</PlacesContext.Provider>;
}

// The directory inside the gate: the names of the places of a trip (G59).
export function usePlaces(): PlaceDirectory {
  const directory = useContext(PlacesContext);
  if (!directory) throw new Error('ui.places_missing');
  return directory;
}

export type PlaceLabel = { readonly name: string; readonly area: string };

// Two levels, so a person always knows where it is (owner decision 29.09.2026):
// "Chilonzor" in "Toshkent shahri"; a whole region says so under its name.
export function usePlaceLabel() {
  const directory = usePlaces();
  const { t } = useI18n();
  return (id: string): PlaceLabel => {
    const place = directory.find(id);
    if (!place) return { name: id, area: '' };
    const region = place.parentId === null ? undefined : directory.find(place.parentId);
    if (region) return { name: place.name, area: region.name };
    return { name: place.name, area: t(place.oneCity ? 'places.wholeCity' : 'places.wholeRegion') };
  };
}
