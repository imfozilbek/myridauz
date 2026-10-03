import type { Point } from '@platform/contracts';
import { useEffect, useRef } from 'react';
import { useApiClients } from '../context/api-clients';
import type { MapView } from '../map/map-engine';
import { requestPosition } from '../telegram/location';

// The map of a pickup starts where the person stands (G35, docs/97 PS12), when Telegram lets us
// know and the place is inside the zone of the trip; otherwise it stays where it opened.
export function useFindMe(
  view: MapView | null,
  inZone: (district: string) => boolean,
  moveTo: (point: Point) => void,
  wanted: boolean,
) {
  const { map } = useApiClients();
  const asked = useRef(false);
  useEffect(() => {
    if (!wanted || !view || asked.current) return undefined;
    asked.current = true;
    let active = true;
    void requestPosition().then(async (point) => {
      if (!point) return;
      const where = await map.where(point).catch(() => null);
      if (active && where?.district && inZone(where.district)) moveTo(point);
    });
    return () => void (active = false);
    // Once, when the map is ready.
  }, [view, wanted]);
}
