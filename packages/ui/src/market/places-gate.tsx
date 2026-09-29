import { createContext, useContext, type ReactNode } from 'react';
import type { PlaceDirectory } from '../places/directory';
import { useDirectory } from '../places/use-directory';
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

// "Chilonzor, Toshkent shahri": the place and its region; a region alone for a whole region.
export function usePlaceName() {
  const directory = useContext(PlacesContext);
  if (!directory) throw new Error('ui.places_missing');
  return (id: string) => {
    const place = directory.find(id);
    if (!place) return id;
    const region = place.parentId === null ? undefined : directory.find(place.parentId);
    return region ? `${place.name}, ${region.name}` : place.name;
  };
}
