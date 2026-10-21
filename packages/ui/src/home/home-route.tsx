import type { Location } from '@platform/contracts';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

// An end undefined: nobody chose it, the block shows where the person stands and where the last
// search went (G76); null: emptied by ⇅.
type Ends = { readonly from: Location | null | undefined; readonly to: Location | null | undefined };
// The end the person chose alone last: it stays when both ends would be one place (G91).
type Last = { readonly last: 'from' | 'to' | null };
type HomeRoute = Ends & Last & { readonly choose: (ends: Partial<Ends>) => void };
const lastOf = (next: Partial<Ends>, now: Last['last']) =>
  'from' in next && 'to' in next ? now : 'from' in next ? 'from' : 'to' in next ? 'to' : now;

const HomeRouteContext = createContext<HomeRoute | null>(null);

// The ends of the block «Qayerdan / Qayerga» on the main screen (G66, docs/118): they live while the
// app is open, so a place picked on its own screen comes back to the main one.
export function HomeRouteProvider({ children }: { readonly children: ReactNode }) {
  const [ends, setEnds] = useState<Ends & Last>({ from: undefined, to: undefined, last: null });
  const value = useMemo<HomeRoute>(
    () => ({
      ...ends,
      choose: (next) => setEnds((now) => ({ ...now, ...next, last: lastOf(next, now.last) })),
    }),
    [ends],
  );
  return <HomeRouteContext.Provider value={value}>{children}</HomeRouteContext.Provider>;
}

// Outside the main screen (a bot link opened the app): nobody chose an end.
const NOBODY: HomeRoute = { from: undefined, to: undefined, last: null, choose: () => undefined };
export const useHomeEnds = (): HomeRoute => useContext(HomeRouteContext) ?? NOBODY;

export function useHomeRoute(): HomeRoute {
  const route = useContext(HomeRouteContext);
  if (!route) throw new Error('useHomeRoute outside HomeRouteProvider');
  return route;
}
