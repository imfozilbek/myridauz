import type { Point, Where } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { useApiClients } from '../context/api-clients';
import type { MapView } from '../map/map-engine';

// A moving map asks once it stops (G24, docs/69): the district and the name under the pin.
const WAIT_MS = 400;
// A resize of the map box also ends a «move» (the sheet grew a line): the same center is not asked
// again, or a name of two lines would ask itself forever (G59).
const SAME_DEGREES = 1e-7;
const same = (a: Point, b: Point) =>
  Math.abs(a.lat - b.lat) < SAME_DEGREES && Math.abs(a.lng - b.lng) < SAME_DEGREES;

export function useWhere(view: MapView | null) {
  const { map } = useApiClients();
  const [where, setWhere] = useState<Where | null>(null);
  const [asking, setAsking] = useState(false);
  useEffect(() => {
    if (!view) return undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let latest = 0;
    let asked: Point | null = null;
    const ask = () => {
      const center = view.center();
      if (asked && same(asked, center)) return;
      asked = center;
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
