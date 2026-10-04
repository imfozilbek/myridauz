import { insideUzbekistan, type Location, type Point } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { knownPosition } from '../telegram/location';
import type { PlaceDirectory } from './directory';

// The district found last time on this phone: it shows at once, and the row never grows when the
// fresh answer comes (G41, docs/108).
const KEY = 'here_district';

function lastHere(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function keepHere(id: string | null) {
  try {
    if (id) localStorage.setItem(KEY, id);
    else localStorage.removeItem(KEY);
  } catch {
    // No storage on this phone: the district comes a moment later.
  }
}

// The district where the person stands (G26, docs/74): «Qayerdan» fills itself, only when the
// person allowed the place before. Nothing is asked here; outside Uzbekistan nothing is filled.
export function useHere(directory: PlaceDirectory | null): Location | null {
  const { map } = useApiClients();
  // undefined: not checked yet, the district of last time stands in.
  const [here, setHere] = useState<Location | null | undefined>(undefined);
  useEffect(() => {
    if (!directory) return undefined;
    let active = true;
    const found = (place: Location | null) => {
      keepHere(place?.id ?? null);
      if (active) setHere(place);
    };
    void knownPosition().then(async (point: Point | null) => {
      if (!point || !insideUzbekistan(point)) return found(null);
      const where = await map.where(point).catch(() => null);
      found((where?.district ? directory.find(where.district) : undefined) ?? null);
    });
    return () => void (active = false);
  }, [map, directory]);
  if (here !== undefined) return here;
  const last = lastHere();
  return (last && directory?.find(last)) || null;
}
