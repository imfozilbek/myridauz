import { appendFileSync } from 'node:fs';
import type { Page } from '@playwright/test';

// Nothing on a screen may blink, shake or jump (G41, docs/108). The page writes down every layout
// shift and every skeleton that shows for a moment only; the walk reads them after each shot.
export const JUMPS = 'screenshots/stand/g27/jumps.txt';
// A skeleton shorter than this tells the person nothing: it is a blink.
const BLINK_MS = 250;
// Shifts below this are rounding, not a jump a person sees.
const SHIFT_MIN = 0.001;

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
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.value < ${SHIFT_MIN} || entry.hadRecentInput) continue;
      const what = (entry.sources || []).map((s) => name(s.node)).join(' | ');
      found.push({ kind: 'shift', what, size: Number(entry.value.toFixed(4)) });
    }
  }).observe({ type: 'layout-shift', buffered: true });
  const shown = new Map();
  new MutationObserver(() => {
    const now = performance.now();
    const busy = new Set(document.querySelectorAll('[aria-busy="true"]'));
    for (const node of busy) if (!shown.has(node)) shown.set(node, now);
    for (const [node, since] of shown) {
      if (busy.has(node)) continue;
      shown.delete(node);
      const ms = Math.round(now - since);
      if (ms < ${BLINK_MS}) found.push({ kind: 'blink', what: name(node), size: ms });
    }
  }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-busy'] });
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
