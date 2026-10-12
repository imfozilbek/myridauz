import type { Location } from '@platform/contracts';
import { useRef } from 'react';
import { useApiClients } from '../context/api-clients';
import { requestPosition } from '../telegram/location';
import type { PlaceDirectory } from './directory';
import { districtAt } from './use-here';

// «Joylashuvim» of the block at the bottom of the main screen (G79 В4, owner 12.10.2026): Telegram
// asks the person, then the district where they stand; null when it stays unknown. One question at
// a time: a second tap while Telegram asks waits for the same answer.
export function useLocate(directory: PlaceDirectory | null) {
  const { map } = useApiClients();
  const asking = useRef<Promise<Location | null> | null>(null);
  return (): Promise<Location | null> => {
    if (!directory) return Promise.resolve(null);
    asking.current ??= requestPosition()
      .then((point) => districtAt(point, map, directory))
      .finally(() => {
        asking.current = null;
      });
    return asking.current;
  };
}
