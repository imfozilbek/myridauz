import type { FoundPlace, Point } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { Icon } from '../icons';
import { haptic } from '../telegram/feedback';

type Props = { readonly at: Point | null; readonly onMove: (point: Point) => void };

// «Yaqin joylar» (docs/126): 3 … 5 known places around the pin from the index of the map (G23),
// no typing; a tap moves the pin there. Nothing while loading or without places.
export function NearChips({ at, onMove }: Props) {
  const { map } = useApiClients();
  const [places, setPlaces] = useState<readonly FoundPlace[]>([]);
  const lat = at?.lat;
  const lng = at?.lng;
  useEffect(() => {
    if (lat === undefined || lng === undefined) return undefined;
    let live = true;
    map.near({ lat, lng }).then(
      (found) => live && setPlaces(found),
      () => undefined,
    );
    return () => void (live = false);
  }, [map, lat, lng]);
  if (places.length === 0) return null;
  return (
    <div className="way-chips">
      {places.map((place) => (
        <button
          key={place.name}
          type="button"
          className="way-chip"
          onClick={() => {
            haptic.select();
            onMove(place.point);
          }}
        >
          <Icon name={place.kind} size={15} />
          {place.name}
        </button>
      ))}
    </div>
  );
}
