import type { Where } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { useApiClients } from '../context/api-clients';
import type { MapView } from '../map/map-engine';

// A moving map asks once it stops (G24, docs/69): the district and the name under the pin.
const WAIT_MS = 400;

export function useWhere(view: MapView | null) {
  const { map } = useApiClients();
  const [where, setWhere] = useState<Where | null>(null);
  const [asking, setAsking] = useState(false);
  useEffect(() => {
    if (!view) return undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let latest = 0;
    const ask = () => {
      clearTimeout(timer);
      setAsking(true);
      timer = setTimeout(() => {
        const asked = (latest += 1);
        map.where(view.center()).then(
          (found) => asked === latest && (setWhere(found), setAsking(false)),
          () => asked === latest && setAsking(false),
        );
      }, WAIT_MS);
    };
    view.onMove(ask);
    ask();
    return () => clearTimeout(timer);
  }, [view, map]);
  return { where, asking };
}
