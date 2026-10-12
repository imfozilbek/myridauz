import type { Location } from '@platform/contracts';
import { useState } from 'react';
import type { Launch } from '../flow/start-action';
import { recentRoutes, rememberRoute } from '../market/recent-routes';
import type { PlaceDirectory } from '../places/directory';
import type { Route } from '../places/route-screen';
import { useHere } from '../places/use-here';
import { useLocate } from '../places/use-locate';
import { useHomeEnds } from './home-route';

// The ends shown in the block «Qayerdan / Qayerga» (G66, docs/118): «Qayerdan» chosen by the person,
// else where they stand, else the start of the last route; it says so while it is where they stand.
// «Qayerga» chosen, else where the last search went: «Oxirgi yoʻnalish» lives here (G76, docs/165).
// trip: the route of the last trip of a driver, after the last search (G79 В4, mockup g76/3 phone 5).
// Standing at the end of the last route, «Qayerga» is the way back.
export function useDockEnds(directory: PlaceDirectory | null, trip: Route | null = null) {
  const { from: chosen, to: picked, choose } = useHomeEnds();
  const here = useHere(directory);
  const locateHere = useLocate(directory);
  // The district found by «Joylashuvim»: the note says so too.
  const [located, setLocated] = useState<string | null>(null);
  const [kept] = useState(recentRoutes);
  const known = (id: string) => directory?.find(id) ?? null;
  const [ids] = kept.filter((route) => known(route.from) && known(route.to));
  const last = (ids ? { from: known(ids.from), to: known(ids.to) } : null) ?? trip;
  const from: Location | null = chosen === undefined ? (here ?? last?.from ?? null) : chosen;
  const toward = last && last.to?.id === from?.id ? last.from : (last?.to ?? null);
  const to: Location | null = picked === undefined ? toward : picked;
  return {
    from,
    to,
    detected: from !== null && (from.id === here?.id || from.id === located),
    swap: () => choose({ from: to, to: from }),
    // The «x» of an end (G79 В4, owner 12.10.2026): the end filled for the person is emptied.
    clearFrom: () => choose({ from: null }),
    clearTo: () => choose({ to: null }),
    // «Joylashuvim» of an empty «Qayerdan» (G79 В4): false when the place stays unknown.
    locate: async () => {
      const place = await locateHere();
      if (place) {
        setLocated(place.id);
        choose({ from: place });
      }
      return place !== null;
    },
  };
}

// «Safar topish» from the ends of the block (G76; G79 П20, П21): both, their trips at once and the
// route kept; one, the other is asked and the trips come right after.
export function startFind({ from, to }: { from: Location | null; to: Location | null }): Launch {
  if (from && to) {
    rememberRoute({ from, to });
    return { route: { from, to } };
  }
  if (from) return { from };
  return to ? { pick: 'from', to } : { pick: 'from' };
}
