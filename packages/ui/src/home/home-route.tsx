import type { Location } from '@platform/contracts';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

// An end undefined: nobody chose it, the block shows where the person stands and where the last
// search went (G76); null: emptied by ⇅.
type Ends = { readonly from: Location | null | undefined; readonly to: Location | null | undefined };
type HomeRoute = Ends & { readonly choose: (ends: Partial<Ends>) => void };

const HomeRouteContext = createContext<HomeRoute | null>(null);

// The ends of the block «Qayerdan / Qayerga» on the main screen (G66, docs/118): they live while the
// app is open, so a place picked on its own screen comes back to the main one.
export function HomeRouteProvider({ children }: { readonly children: ReactNode }) {
  const [ends, setEnds] = useState<Ends>({ from: undefined, to: undefined });
  const value = useMemo<HomeRoute>(
    () => ({ ...ends, choose: (next) => setEnds((now) => ({ ...now, ...next })) }),
    [ends],
  );
  return <HomeRouteContext.Provider value={value}>{children}</HomeRouteContext.Provider>;
}

export function useHomeRoute(): HomeRoute {
  const route = useContext(HomeRouteContext);
  if (!route) throw new Error('useHomeRoute outside HomeRouteProvider');
  return route;
}
