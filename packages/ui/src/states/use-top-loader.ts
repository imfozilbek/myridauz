import { activity } from '@platform/api-client';
import { useEffect, useState } from 'react';

// docs/121 §3: a fast answer never shows the line; a line once shown stays long enough to be seen,
// then fades out (G41: nothing blinks).
const SHOW_AFTER_MS = 300;
const SHOW_AT_LEAST_MS = 400;
const FADE_MS = 200;

export type TopLoaderState = 'hidden' | 'shown' | 'leaving';
type Timer = ReturnType<typeof setTimeout> | undefined;

export function useTopLoader(): TopLoaderState {
  const [state, setState] = useState<TopLoaderState>('hidden');
  useEffect(() => {
    // Each wait has its own timer: a new request never cancels the fading of the line.
    let shownAt = 0;
    let showing: Timer;
    let leaving: Timer;
    let fading: Timer;
    const show = () => {
      showing = undefined;
      clearTimeout(fading);
      shownAt = Date.now();
      setState('shown');
    };
    const leave = () => {
      shownAt = 0;
      setState('leaving');
      fading = setTimeout(() => setState('hidden'), FADE_MS);
    };
    const stop = activity.subscribe((busy) => {
      if (busy > 0) {
        clearTimeout(leaving);
        if (shownAt === 0 && showing === undefined) showing = setTimeout(show, SHOW_AFTER_MS);
        return;
      }
      clearTimeout(showing);
      showing = undefined;
      if (shownAt !== 0) leaving = setTimeout(leave, Math.max(0, shownAt + SHOW_AT_LEAST_MS - Date.now()));
    });
    return () => {
      stop();
      [showing, leaving, fading].forEach(clearTimeout);
    };
  }, []);
  return state;
}
