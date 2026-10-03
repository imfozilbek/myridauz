import { insideParts, pointInside } from '@platform/contracts';
import { useEffect, useRef } from 'react';
import { useApiClients } from '../context/api-clients';
import type { MapView } from '../map/map-engine';

// The map of a point is cut by a border (G24, docs/71). With a zone (a booking, G26, docs/74) the
// cut is the zone and never goes away. Without one it follows the district under the pin: a move
// to another place takes the cut away until the new district is known.
type Under = { readonly district: string | null } | null;

export function useClip(view: MapView | null, where: Under, zone: string | null) {
  const { map } = useApiClients();
  const clipped = useRef<string | null>(null);
  const target = zone ?? where?.district ?? null;
  useEffect(() => {
    if (!view || !target || clipped.current === target) return;
    clipped.current = target;
    // A border that comes after the person moved to another place is stale: it would pull the map back.
    const fresh = () => clipped.current === target;
    map.border(target).then(
      (border) => {
        if (!fresh()) return;
        view.clip(border.parts);
        // The center of a district may lie outside its own border (Urganch shahri): the map of a
        // zone opens inside it, never on a place it refuses (G35).
        const inside = zone && !insideParts(border.parts, view.center()) ? pointInside(border.parts) : null;
        if (inside) view.moveTo(inside);
      },
      () => fresh() && view.clip(null),
    );
    // Each new answer under the pin: after a move the same district is cut again.
  }, [view, target, where, map]);
  return () => {
    if (zone) return;
    clipped.current = null;
    view?.clip(null);
  };
}
