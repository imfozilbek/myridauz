import { createContext, useContext, type ReactNode } from 'react';
import type { PlaceDirectory } from '../places/directory';
import { useDirectory } from '../places/use-directory';
import { useI18n } from '../context/i18n-context';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';

const PlacesContext = createContext<PlaceDirectory | null>(null);

// Trips and requests carry place ids; their names come from the directory, loaded once (docs/48).
export function PlacesGate({ children }: { readonly children: ReactNode }) {
  const [state, retry] = useDirectory();
  if (state.status === 'loading') return <ScreenSkeleton />;
  if (state.status === 'error') return <ErrorScreen onRetry={retry} />;
  return <PlacesContext.Provider value={state.directory}>{children}</PlacesContext.Provider>;
}

export type PlaceLabel = { readonly name: string; readonly area: string };

// Two levels, so a person always knows where it is (owner decision 29.09.2026):
// "Chilonzor" in "Toshkent shahri"; a whole region says so under its name.
export function usePlaceLabel() {
  const directory = useContext(PlacesContext);
  const { t } = useI18n();
  if (!directory) throw new Error('ui.places_missing');
  return (id: string): PlaceLabel => {
    const place = directory.find(id);
    if (!place) return { name: id, area: '' };
    const region = place.parentId === null ? undefined : directory.find(place.parentId);
    if (region) return { name: place.name, area: region.name };
    return { name: place.name, area: t(place.oneCity ? 'places.wholeCity' : 'places.wholeRegion') };
  };
}
