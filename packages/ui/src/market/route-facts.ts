import type { Pitak, Recommendation } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { useApiClients } from '../context/api-clients';
import type { Route } from '../places/route-screen';
import { regionOf } from '../way/way-end';

// What a route brings with it, taken anew for every route (docs/09, docs/72): the recommended price
// and the pitak of the direction. A pitak joins two regions: without it people go from their doors.
// The pitak is undefined while it loads, null when the direction has none.
export function useRouteFacts(route: Route | undefined, onFail: () => void) {
  const { market, map } = useApiClients();
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [pitak, setPitak] = useState<Pitak | null | undefined>(undefined);
  useEffect(() => {
    if (!route) return;
    setRecommendation(null);
    setPitak(undefined);
    market.recommend(route.from.id, route.to.id).then(setRecommendation, onFail);
    map.pitakOf(regionOf(route.from), regionOf(route.to)).then(setPitak, () => setPitak(null));
    // Only a new route loads again: «onFail» is a new function on every render.
  }, [route, market, map]);
  return { recommendation, pitak };
}
