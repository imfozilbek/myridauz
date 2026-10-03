import type { Schedule } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { useApiClients } from '../context/api-clients';

// Without an answer the screen offers every time after the lead time: the server checks again (docs/103).
const OPEN: Schedule = { windows: [], full: false };

// The busy times of the driver for a new trip on this route (G38, docs/103); null while loading.
export function useSchedule(from: string, to: string): Schedule | null {
  const { market } = useApiClients();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  useEffect(() => {
    let live = true;
    setSchedule(null);
    market.schedule(from, to).then(
      (value) => live && setSchedule(value),
      () => live && setSchedule(OPEN),
    );
    return () => void (live = false);
  }, [market, from, to]);
  return schedule;
}
