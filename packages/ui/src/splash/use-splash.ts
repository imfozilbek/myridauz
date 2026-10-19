import { activity } from '@platform/api-client';
import { useEffect } from 'react';
import { paintSplash } from '../telegram/chrome';
import { SPLASH_ID, SPLASH_STYLE_ID } from './splash-html';

// docs/121 §4: the splash stands while the app checks the person and loads the first screen, at least
// 0,6 s so it never blinks, and not a moment longer; then it fades out in 0,3 s by itself.
const SHOW_AT_LEAST_MS = 600;
const FADE_MS = 300;
// The first screen is ready when nothing is loading for this long: one load often starts the next
// (the account, then the screen), with a short quiet moment between them.
const SETTLE_MS = 150;
const OUT = 'splash-out';
type Timer = ReturnType<typeof setTimeout> | undefined;

function leave(splash: HTMLElement): void {
  paintSplash(undefined);
  splash.classList.add(OUT);
  setTimeout(() => {
    splash.remove();
    document.getElementById(SPLASH_STYLE_ID)?.remove();
  }, FADE_MS);
}

// Runs in the shell, after the first screens have started their loads (their effects run first).
// onReady gets the time from the tap to the ready first screen (app_ready, docs/29). A return from the
// background finds no splash: it is gone for the life of the page.
export function useSplash(color: string, onReady: (ms: number) => void): void {
  useEffect(() => {
    const splash = document.getElementById(SPLASH_ID);
    if (!splash) return;
    paintSplash(color);
    let settling: Timer;
    let leaving: Timer;
    const ready = () => {
      stop();
      const ms = Math.round(performance.now());
      onReady(ms);
      leaving = setTimeout(() => leave(splash), Math.max(0, SHOW_AT_LEAST_MS - ms));
    };
    const watch = (busy: number) => {
      clearTimeout(settling);
      if (busy === 0) settling = setTimeout(ready, SETTLE_MS);
    };
    const stop = activity.subscribe(watch);
    watch(activity.busy());
    return () => {
      stop();
      clearTimeout(settling);
      clearTimeout(leaving);
    };
  }, [color, onReady]);
}
