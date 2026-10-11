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
  return useHereChecked(directory) ?? null;
}

// The same, and undefined while the phone is still asked and no district of last time stands in:
// a screen waits instead of showing a list that changes by itself a moment later (G59).
export function useHereChecked(directory: PlaceDirectory | null): Location | null | undefined {
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
  return (last && directory?.find(last)) || undefined;
}

// A screen waits for the place of the person a moment only (G59, G79 В8). live: the place now, as
// useHere; settled: undefined while the phone is asked, then the place or null, and an answer later
// than the wait never changes what the screen opened.
const HERE_WAIT_MS = 1500;
export function useHereAsked(directory: PlaceDirectory | null) {
  const here = useHereChecked(directory);
  const [gaveUp, setGaveUp] = useState(false);
  const asking = here === undefined;
  useEffect(() => {
    if (!asking) return undefined;
    const timer = setTimeout(() => setGaveUp(true), HERE_WAIT_MS);
    return () => clearTimeout(timer);
  }, [asking]);
  return { live: here ?? null, settled: gaveUp ? null : here };
}
