import { useEffect, useRef, useState } from 'react';
import { useDraft, type DraftCheck } from '../screen/draft';

// A path of steps kept as a draft (docs/94 F3): its step and answers are written after each change;
// reopened, the path goes on where it stopped. A path opened with its own start (the last route of
// the main screen) does not take the draft; untouched, nothing is written.
export function useFlowDraft<T>(key: string, check: DraftCheck<T>, start: T, fresh = false) {
  const { restored, save, clear } = useDraft(key, check);
  const back = fresh ? null : restored;
  const [value, setValue] = useState<T>(back ?? start);
  const first = useRef(value);
  useEffect(() => {
    if (value !== first.current) save(value);
  }, [value, save]);
  return { value, setValue, restored: back !== null, clear };
}

// A draft is an object from JSON: its fields are checked one by one by the path that reads it.
export const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
