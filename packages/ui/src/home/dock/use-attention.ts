import { useEffect, useRef, useState } from 'react';
import { useActionQueue } from '../../action-sheet/action-queue';
import { keepValue, keptValue } from '../../screen/list-memory';
import { useBehind } from '../../telegram/behind';
import { haptic } from '../../telegram/feedback';

// The thing the block shows now: its own id and its level of docs/165 (1 the most important).
export type Thing = { readonly id: string; readonly level: number; readonly loud: boolean };

// When the block calls the eye (G76, docs/165): a new thing as important as the last one or more,
// with «Hozir: …» over it. A less important one comes quietly; while a sheet or a screen stands over
// the block, it waits for it to close. Each call shakes the phone once and returns a new number: the cue swings, the button
// shines once more. The last thing is kept while the app is open: the block comes back after a
// section or a chat, and the same thing does not call again.
const LAST = 'dock.attention';

export function useAttention({ id, level, loud }: Thing): number {
  const [calls, setCalls] = useState(0);
  const due = useRef(false);
  const queued = useActionQueue().length > 0;
  // A screen over the main one (a chat, the application form) holds it too: the call waits (G77).
  const behind = useBehind();
  const sheet = queued || behind;
  useEffect(() => {
    const before = keptValue<Thing>(LAST) ?? null;
    keepValue(LAST, { id, level, loud });
    if (before?.id === id) return;
    due.current = loud && (before === null || level <= before.level);
  }, [id, level, loud]);
  useEffect(() => {
    if (!due.current || sheet) return;
    due.current = false;
    haptic.attention();
    setCalls((count) => count + 1);
  }, [id, sheet]);
  return calls;
}
