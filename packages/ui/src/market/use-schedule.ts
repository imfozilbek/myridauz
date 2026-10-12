import type { Schedule } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { useApiClients } from '../context/api-clients';

// Without an answer the screen offers every time after the lead time: the server checks again (docs/103).
const OPEN: Schedule = { full: false };

// Whether the driver has a live trip already (one at a time, docs/172); null while loading.
export function useSchedule(): Schedule | null {
  const { market } = useApiClients();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  useEffect(() => {
    let live = true;
    setSchedule(null);
    market.schedule().then(
      (value) => live && setSchedule(value),
      () => live && setSchedule(OPEN),
    );
    return () => void (live = false);
  }, [market]);
  return schedule;
}
