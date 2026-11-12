import { useLayoutEffect, useRef } from 'react';

// One line that is never cut (docs/121): the words keep the size of the mockup and get smaller only as
// much as their room asks, whatever the language and the font of the phone. The sizes were chosen for
// the Latin; the Cyrillic is wider, and each phone has its own font (G98, docs/228).
// Sizes in tenths of a pixel.
const TENTHS = 10;
const TRIES = 10;

function fit(line: HTMLElement) {
  line.style.removeProperty('font-size');
  const room = line.clientWidth;
  if (room === 0 || line.scrollWidth <= room) return;
  const mockup = Number.parseFloat(getComputedStyle(line).fontSize);
  if (!Number.isFinite(mockup)) return;
  let tenths = Math.floor((mockup * room * TENTHS) / line.scrollWidth);
  // The width of words is not quite in proportion to their size: a few small steps more, if needed.
  for (let tries = 0; tries < TRIES; tries += 1) {
    line.style.fontSize = `${(tenths / TENTHS).toFixed(1)}px`;
    if (line.scrollWidth <= line.clientWidth) return;
    tenths -= 1;
  }
}

// The ref of the line; it is fitted again when its words or its room change.
export function useFitLine<T extends HTMLElement>(words: string) {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const line = ref.current;
    if (!line) return undefined;
    fit(line);
    if (typeof ResizeObserver === 'undefined') return undefined;
    // Only a new width asks for a new size, fitted in the next frame: a size changed while the browser
    // tells of sizes would be a loop of the observers («ResizeObserver loop»).
    let width = line.clientWidth;
    let frame = 0;
    const observer = new ResizeObserver(() => {
      if (line.clientWidth === width) return;
      width = line.clientWidth;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => fit(line));
    });
    observer.observe(line);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [words]);
  return ref;
}
