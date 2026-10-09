import type { Location } from '@platform/contracts';
import { useState } from 'react';
import { recentRoutes } from '../market/recent-routes';
import type { PlaceDirectory } from '../places/directory';
import { useHere } from '../places/use-here';
import { useHomeRoute } from './home-route';

// The ends shown in the block «Qayerdan / Qayerga» (G66, docs/118): «Qayerdan» chosen by the person,
// else where they stand, else the start of the last route; it says so while it is where they stand.
// «Qayerga» only chosen.
export function useDockEnds(directory: PlaceDirectory | null) {
  const { from: chosen, to, choose } = useHomeRoute();
  const here = useHere(directory);
  const [kept] = useState(recentRoutes);
  const last = directory ? (kept.map((ids) => directory.find(ids.from)).find(Boolean) ?? null) : null;
  const from: Location | null = chosen === undefined ? (here ?? last) : chosen;
  return {
    from,
    to,
    detected: here !== null && from?.id === here.id,
    swap: () => choose({ from: to, to: from }),
  };
}
