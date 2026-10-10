import type { Location } from '@platform/contracts';
import { useState } from 'react';
import { recentRoutes } from '../market/recent-routes';
import type { PlaceDirectory } from '../places/directory';
import { useHere } from '../places/use-here';
import { useHomeRoute } from './home-route';

// The ends shown in the block «Qayerdan / Qayerga» (G66, docs/118): «Qayerdan» chosen by the person,
// else where they stand, else the start of the last route; it says so while it is where they stand.
// «Qayerga» chosen, else where the last search went: «Oxirgi yoʻnalish» lives here (G76, docs/165).
export function useDockEnds(directory: PlaceDirectory | null) {
  const { from: chosen, to: picked, choose } = useHomeRoute();
  const here = useHere(directory);
  const [kept] = useState(recentRoutes);
  const known = (id: string) => directory?.find(id) ?? null;
  const [last] = kept.filter((ids) => known(ids.from) && known(ids.to));
  const from: Location | null = chosen === undefined ? (here ?? (last ? known(last.from) : null)) : chosen;
  const to: Location | null = picked === undefined ? (last ? known(last.to) : null) : picked;
  return {
    from,
    to,
    detected: here !== null && from?.id === here.id,
    swap: () => choose({ from: to, to: from }),
  };
}
