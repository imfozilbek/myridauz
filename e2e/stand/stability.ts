import { appendFileSync } from 'node:fs';
import type { Page } from '@playwright/test';

// Nothing on a screen may blink, shake or jump (G41, docs/108). The page writes down every layout
// shift and every skeleton a person saw for a moment only (a hidden one waits, docs/108 B); the
// walk reads them after each shot.
const JUMPS = 'screenshots/stand/g27/jumps.txt';
// A skeleton shorter than this tells the person nothing: it is a blink.
const BLINK_MS = 250;
// Shifts below this are rounding, not a jump a person sees.
const SHIFT_MIN = 0.001;
// A shift this soon after typing follows the person's own input, as the browser counts it.
const INPUT_MS = 500;

type Found = { readonly kind: 'shift' | 'blink'; readonly what: string; readonly size: number };

const WATCH = `(() => {
  const found = [];
  window.__stability = found;
  const name = (node) =>
    node && node.nodeType === 1
      ? node.tagName.toLowerCase() + (node.className && typeof node.className === 'string'
          ? '.' + node.className.trim().split(/\\s+/).filter((c) => !c.startsWith('tgui-')).join('.')
          : '') + ' «' + (node.textContent || '').trim().slice(0, 30) + '»'
      : '?';
  // A filled field moves what shows the text, as typing does; the browser marks only keys as input.
  let typed = -Infinity;
  document.addEventListener('input', () => (typed = performance.now()), true);
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const byInput = entry.hadRecentInput || entry.startTime - typed < ${INPUT_MS};
      if (entry.value < ${SHIFT_MIN} || byInput) continue;
      // What moved, by how much, and what stands above it: the cause is usually there.
      const what = (entry.sources || [])
        .map((s) => {
          const [was, now] = [s.previousRect, s.currentRect];
          const moved = [now.x - was.x, now.y - was.y, now.width - was.width, now.height - was.height].map(Math.round);
          return name(s.node) + ' moved x,y,w,h ' + moved.join(',') + ' under ' +
            name(s.node && s.node.previousElementSibling) + ' at ' + Math.round(entry.startTime) + 'ms';
        })
        .join(' | ');
      found.push({ kind: 'shift', what, size: Number(entry.value.toFixed(4)) });
    }
  }).observe({ type: 'layout-shift', buffered: true });
  const shown = new Map();
  new MutationObserver(() => {
    const now = performance.now();
    const busy = new Set(document.querySelectorAll('[aria-busy="true"]:not([data-hidden])'));
    for (const node of busy) if (!shown.has(node)) shown.set(node, now);
    for (const [node, since] of shown) {
      if (busy.has(node)) continue;
      shown.delete(node);
      const ms = Math.round(now - since);
      if (ms < ${BLINK_MS}) found.push({ kind: 'blink', what: name(node), size: ms });
    }
  }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-busy', 'data-hidden'] });
})();`;

// Before the app opens: the watch starts with the first frame.
export const watchStability = (page: Page) => page.addInitScript(WATCH);

// What blinked or jumped since the last read, written down under the name of the shot.
export async function readStability(page: Page, name: string): Promise<readonly Found[]> {
  const found = await page.evaluate(() => {
    const list = (window as unknown as { __stability?: Found[] }).__stability ?? [];
    return list.splice(0, list.length);
  });
  if (found.length > 0)
    appendFileSync(JUMPS, found.map((f) => `${name}: ${f.kind} ${f.size} ${f.what}\n`).join(''));
  return found;
}
