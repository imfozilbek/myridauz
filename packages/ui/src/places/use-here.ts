import { insideUzbekistan, type Location, type Point } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { knownPosition } from '../telegram/location';
import type { PlaceDirectory } from './directory';

// The district where the person stands (G26, docs/74): «Qayerdan» fills itself, only when the
// person allowed the place before. Nothing is asked here; outside Uzbekistan nothing is filled.
export function useHere(directory: PlaceDirectory | null): Location | null {
  const { map } = useApiClients();
  const [here, setHere] = useState<Location | null>(null);
  useEffect(() => {
    if (!directory) return undefined;
    let active = true;
    void knownPosition().then(async (point: Point | null) => {
      if (!point || !insideUzbekistan(point)) return;
      const where = await map.where(point).catch(() => null);
      const place = where?.district ? directory.find(where.district) : undefined;
      if (active && place) setHere(place);
    });
    return () => void (active = false);
  }, [map, directory]);
  return here;
}
